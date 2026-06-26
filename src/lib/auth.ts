import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import { sendOtpEmail } from "@/lib/email";
import { isEmailAllowed } from "@/lib/access";

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
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isEmailAllowed(user.email)) {
            throw new APIError("FORBIDDEN", { message: "EMAIL_NOT_ALLOWED" });
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp }) {
        // Gate sign-in to the allowlist (if configured) — no code is sent
        // to addresses that aren't authorized.
        if (!isEmailAllowed(email)) {
          throw new APIError("FORBIDDEN", { message: "EMAIL_NOT_ALLOWED" });
        }
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});
