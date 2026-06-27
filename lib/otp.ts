import crypto from "crypto";
import bcrypt from "bcryptjs";

/** Generate a cryptographically random 6-digit OTP string (zero-padded). */
export function generateOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, "0");
}

/** Hash an OTP for storage. Cost 10 since OTPs are short-lived and rate-limited. */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/** Compare a plaintext OTP against its bcrypt hash. */
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
