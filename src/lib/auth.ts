import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import { sendOtpEmail } from "@/lib/email";

if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  console.warn(
    "[tierlistrr] BETTER_AUTH_SECRET is not set — set it in production!",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "dev-insecure-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL || undefined,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});
