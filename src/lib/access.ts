// Optional sign-in allowlist. Configure with AUTH_ALLOWED_EMAILS, a list
// (comma / space / newline separated) of:
//   - exact emails        -> alice@example.com
//   - whole domains       -> @example.com   (or just example.com)
// If unset/empty, sign-in is open to everyone (default).

export function isEmailAllowed(email: string): boolean {
  const raw = process.env.AUTH_ALLOWED_EMAILS;
  if (!raw || !raw.trim()) return true;

  const entries = raw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (entries.length === 0) return true;

  const e = email.trim().toLowerCase();
  const domain = e.split("@")[1] ?? "";

  return entries.some((entry) => {
    if (entry.startsWith("@")) return domain === entry.slice(1);
    if (!entry.includes("@")) return domain === entry; // bare domain
    return e === entry; // exact email
  });
}
