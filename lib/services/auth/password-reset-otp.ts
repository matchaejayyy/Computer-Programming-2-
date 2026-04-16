import { createHash, randomInt } from "crypto";

const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

function otpSecret() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEON_AUTH_COOKIE_SECRET?.trim() ||
    "local-dev-secret"
  );
}

export function generateOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(min, max));
}

export function hashOtp(email: string, otp: string): string {
  return createHash("sha256")
    .update(`${email.toLowerCase()}|${otp}|${otpSecret()}`)
    .digest("hex");
}
