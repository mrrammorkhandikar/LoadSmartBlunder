import "dotenv/config";
import twilio from "twilio";

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const normalizePhoneForTwilio = (phone: string) => {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone;
};

async function main() {
  const rawPhone = process.argv[2] || process.env.OTP_TEST_PHONE;

  if (!rawPhone) {
    console.error("Usage: npm run test:otp -- <phone_number>");
    process.exit(1);
  }

  if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
    console.error("Twilio environment variables are not fully configured.");
    console.error("Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID");
    process.exit(1);
  }

  const client = twilio(twilioAccountSid, twilioAuthToken);
  const to = normalizePhoneForTwilio(rawPhone);

  console.log(`Sending test OTP via Twilio Verify to ${to}...`);

  try {
    const result = await client.verify.v2
      .services(twilioVerifyServiceSid)
      .verifications.create({
        to,
        channel: "sms",
      });

    console.log("Twilio Verify response:");
    console.log(`  SID: ${result.sid}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  To: ${result.to}`);
    console.log(`  Channel: ${result.channel}`);
  } catch (error: any) {
    console.error("Failed to send OTP via Twilio Verify.");
    if (error?.code) {
      console.error(`  Code: ${error.code}`);
    }
    if (error?.message) {
      console.error(`  Message: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

