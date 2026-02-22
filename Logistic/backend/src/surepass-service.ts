import crypto from "crypto";
import { db } from "./db";
import { apiLogs } from "@shared/schema";
import { SurepassEncryptedClient, SurepassError } from "./surepass-client";
import { parseSurepassResponse, type SurepassResponse } from "./surepass-types";
import { createSurepassKycRequest, updateSurepassKycRequest } from "./surepass-storage";

type PanVerificationResult = {
  pan_number?: string;
  full_name?: string;
  category?: string;
  status?: string;
};

type VerifyPanInput = {
  panNumber: string;
  userId?: string;
  requestRef?: string;
};

type VerifyGstinInput = {
  gstinNumber: string;
  userId?: string;
  requestRef?: string;
};

type VerifyEmailInput = {
  email: string;
  userId?: string;
  requestRef?: string;
};

type PanComprehensiveResult = {
  pan_number?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  masked_aadhaar?: string;
};

type GstinVerificationResult = {
  gstin?: string;
  pan_number?: string;
  legal_name?: string;
  business_name?: string;
  gstin_status?: string;
};

type EmailCheckResult = {
  email?: string;
  status?: string;
  deliverable?: boolean;
};

export function maskValue(value: string) {
  if (value.length <= 4) {
    return "*".repeat(value.length);
  }
  return `${value.slice(0, 2)}${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-2)}`;
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return maskValue(email);
  const maskedLocal = local.length <= 2 ? `${local[0] || "*"}*` : `${local[0]}${"*".repeat(local.length - 2)}${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

function sanitizePanRequest(panNumber: string) {
  return {
    pan_last4: panNumber.slice(-4),
    pan_masked: maskValue(panNumber),
    pan_hash: hashValue(panNumber),
  };
}

function sanitizePanResponse(data: PanVerificationResult | undefined) {
  if (!data) return undefined;
  return {
    ...data,
    pan_number: data.pan_number ? maskValue(data.pan_number) : undefined,
  };
}

function sanitizePanComprehensiveResponse(data: PanComprehensiveResult | undefined) {
  if (!data) return undefined;
  return {
    ...data,
    pan_number: data.pan_number ? maskValue(data.pan_number) : undefined,
    email: data.email ? maskEmail(data.email) : undefined,
    phone_number: data.phone_number ? maskValue(data.phone_number) : undefined,
    masked_aadhaar: data.masked_aadhaar ? maskValue(data.masked_aadhaar) : undefined,
  };
}

function sanitizeGstinRequest(gstinNumber: string) {
  return {
    gstin_last4: gstinNumber.slice(-4),
    gstin_masked: maskValue(gstinNumber),
    gstin_hash: hashValue(gstinNumber),
  };
}

function sanitizeGstinResponse(data: GstinVerificationResult | undefined) {
  if (!data) return undefined;
  return {
    ...data,
    gstin: data.gstin ? maskValue(data.gstin) : undefined,
    pan_number: data.pan_number ? maskValue(data.pan_number) : undefined,
  };
}

function sanitizeEmailRequest(email: string) {
  return {
    email_masked: maskEmail(email),
    email_hash: hashValue(email.toLowerCase()),
  };
}

function sanitizeEmailResponse(data: EmailCheckResult | undefined) {
  if (!data) return undefined;
  return {
    ...data,
    email: data.email ? maskEmail(data.email) : undefined,
  };
}

async function logSurepassCall(input: {
  userId?: string;
  endpoint: string;
  method: string;
  requestBody?: unknown;
  responseBody?: unknown;
  statusCode?: number;
  errorMessage?: string;
  durationMs: number;
}) {
  await db.insert(apiLogs).values({
    userId: input.userId,
    endpoint: input.endpoint,
    method: input.method,
    requestBody: input.requestBody,
    responseBody: input.responseBody,
    statusCode: input.statusCode,
    errorMessage: input.errorMessage,
    durationMs: input.durationMs,
    logType: "surepass",
    createdAt: new Date(),
  });
}

async function postPlainSurepass<T>(input: {
  userId?: string;
  endpoint: string;
  baseUrl: string;
  requestType: string;
  requestRef?: string;
  requestHash?: string;
  requestMasked?: Record<string, unknown> | null;
  body: unknown;
  sanitizeResponse?: (data: T | undefined) => unknown;
}) {
  const startedAt = Date.now();
  const record = await createSurepassKycRequest({
    userId: input.userId,
    requestType: input.requestType,
    requestRef: input.requestRef,
    status: "pending",
    requestHash: input.requestHash,
    requestMasked: input.requestMasked ?? null,
  });
  try {
    const token = process.env.SUREPASS_API_TOKEN || "";
    if (!token) {
      throw new Error("Surepass API token missing");
    }
    const response = await fetch(`${input.baseUrl}${input.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input.body),
    });
    const payload = await response.json();
    const parsed = parseSurepassResponse<T>(payload) as SurepassResponse<T>;
    if (!response.ok) {
      throw new SurepassError("Surepass request failed", response.status, parsed);
    }
    const sanitizedResponse = input.sanitizeResponse ? input.sanitizeResponse(parsed.data) : parsed.data;
    await updateSurepassKycRequest(record.id, {
      status: parsed.success ? "success" : "failed",
      responseStatusCode: parsed.status_code,
      responseMessageCode: parsed.message_code,
      responseMasked: sanitizedResponse ?? null,
    });
    await logSurepassCall({
      userId: input.userId,
      endpoint: input.endpoint,
      method: "POST",
      requestBody: input.requestMasked,
      responseBody: sanitizedResponse ?? null,
      statusCode: parsed.status_code,
      durationMs: Date.now() - startedAt,
    });
    return parsed;
  } catch (error: any) {
    const message = error instanceof SurepassError ? error.message : "Surepass request failed";
    await updateSurepassKycRequest(record.id, {
      status: "failed",
      errorMessage: message,
    });
    await logSurepassCall({
      userId: input.userId,
      endpoint: input.endpoint,
      method: "POST",
      requestBody: input.requestMasked,
      responseBody: null,
      statusCode: error?.status,
      errorMessage: message,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function verifyPan(input: VerifyPanInput) {
  const client = SurepassEncryptedClient.fromEnv();
  const startedAt = Date.now();
  const maskedRequest = sanitizePanRequest(input.panNumber);
  const record = await createSurepassKycRequest({
    userId: input.userId,
    requestType: "pan",
    requestRef: input.requestRef,
    status: "pending",
    requestHash: maskedRequest.pan_hash,
    requestMasked: maskedRequest,
  });
  try {
    const response = await client.postJson<PanVerificationResult>("/api/v1/pan/pan", {
      pan_number: input.panNumber,
    });
    const sanitizedResponse = sanitizePanResponse(response.data);
    await updateSurepassKycRequest(record.id, {
      status: response.success ? "success" : "failed",
      responseStatusCode: response.status_code,
      responseMessageCode: response.message_code,
      responseMasked: sanitizedResponse ?? null,
    });
    await logSurepassCall({
      userId: input.userId,
      endpoint: "/api/v1/pan/pan",
      method: "POST",
      requestBody: maskedRequest,
      responseBody: sanitizedResponse ?? null,
      statusCode: response.status_code,
      durationMs: Date.now() - startedAt,
    });
    return response;
  } catch (error: any) {
    const message = error instanceof SurepassError ? error.message : "Surepass PAN verification failed";
    await updateSurepassKycRequest(record.id, {
      status: "failed",
      errorMessage: message,
    });
    await logSurepassCall({
      userId: input.userId,
      endpoint: "/api/v1/pan/pan",
      method: "POST",
      requestBody: maskedRequest,
      responseBody: null,
      statusCode: error?.status,
      errorMessage: message,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function verifyPanComprehensive(input: VerifyPanInput) {
  const baseUrl = process.env.SUREPASS_KYC_BASE_URL || "https://kyc-api.surepass.io";
  const maskedRequest = sanitizePanRequest(input.panNumber);
  return postPlainSurepass<PanComprehensiveResult>({
    userId: input.userId,
    endpoint: "/api/v1/pan/pan-comprehensive",
    baseUrl,
    requestType: "pan_comprehensive",
    requestRef: input.requestRef,
    requestHash: maskedRequest.pan_hash,
    requestMasked: maskedRequest,
    body: { id_number: input.panNumber },
    sanitizeResponse: sanitizePanComprehensiveResponse,
  });
}

export async function verifyGstin(input: VerifyGstinInput) {
  const baseUrl = process.env.SUREPASS_PLAIN_BASE_URL || "https://sandbox.surepass.io";
  const maskedRequest = sanitizeGstinRequest(input.gstinNumber);
  return postPlainSurepass<GstinVerificationResult>({
    userId: input.userId,
    endpoint: "/api/v1/corporate/gstin",
    baseUrl,
    requestType: "gstin",
    requestRef: input.requestRef,
    requestHash: maskedRequest.gstin_hash,
    requestMasked: maskedRequest,
    body: { id_number: input.gstinNumber },
    sanitizeResponse: sanitizeGstinResponse,
  });
}

export async function verifyEmailCheck(input: VerifyEmailInput) {
  const baseUrl = process.env.SUREPASS_PLAIN_BASE_URL || "https://sandbox.surepass.io";
  const maskedRequest = sanitizeEmailRequest(input.email);
  return postPlainSurepass<EmailCheckResult>({
    userId: input.userId,
    endpoint: "/api/v1/employment/email-check",
    baseUrl,
    requestType: "email_check",
    requestRef: input.requestRef,
    requestHash: maskedRequest.email_hash,
    requestMasked: maskedRequest,
    body: { email: input.email },
    sanitizeResponse: sanitizeEmailResponse,
  });
}
