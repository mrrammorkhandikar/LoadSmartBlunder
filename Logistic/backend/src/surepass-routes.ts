import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { verifyEmailCheck, verifyGstin, verifyPan, verifyPanComprehensive } from "./surepass-service";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const panSchema = z.object({
  pan_number: z.string().min(5),
  request_ref: z.string().optional(),
});

const gstinSchema = z.object({
  gstin_number: z.string().min(5),
  request_ref: z.string().optional(),
});

const emailSchema = z.object({
  email: z.string().email(),
  request_ref: z.string().optional(),
});

export function registerSurepassRoutes(app: Express) {
  app.post("/api/kyc/pan", requireAuth, async (req, res) => {
    try {
      const payload = panSchema.parse(req.body);
      const response = await verifyPan({
        panNumber: payload.pan_number,
        userId: req.session?.userId,
        requestRef: payload.request_ref,
      });
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: "Surepass PAN verification failed" });
    }
  });

  app.post("/api/kyc/pan-comprehensive", requireAuth, async (req, res) => {
    try {
      const payload = panSchema.parse(req.body);
      const response = await verifyPanComprehensive({
        panNumber: payload.pan_number,
        userId: req.session?.userId,
        requestRef: payload.request_ref,
      });
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: "Surepass PAN comprehensive verification failed" });
    }
  });

  app.post("/api/kyc/gstin", requireAuth, async (req, res) => {
    try {
      const payload = gstinSchema.parse(req.body);
      const response = await verifyGstin({
        gstinNumber: payload.gstin_number,
        userId: req.session?.userId,
        requestRef: payload.request_ref,
      });
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: "Surepass GSTIN verification failed" });
    }
  });

  app.post("/api/kyc/email-check", requireAuth, async (req, res) => {
    try {
      const payload = emailSchema.parse(req.body);
      const response = await verifyEmailCheck({
        email: payload.email,
        userId: req.session?.userId,
        requestRef: payload.request_ref,
      });
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: "Surepass email verification failed" });
    }
  });
}
