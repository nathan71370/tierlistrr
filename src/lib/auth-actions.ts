"use server";

import { isEmailAllowed } from "@/lib/access";

// Lightweight check so the sign-in UI can reject a non-allowlisted email
// immediately. Real enforcement still lives in the auth server (OTP send +
// account-creation hook) — this is purely for UX.
export async function checkEmailAllowed(email: string): Promise<boolean> {
  return isEmailAllowed(email);
}
