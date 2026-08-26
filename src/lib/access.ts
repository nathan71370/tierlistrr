import { readFile } from "node:fs/promises";

// Optional sign-in allowlist, read from a plain-text file at WHITELIST_PATH.
// One entry per line, `#` starts a comment:
//   - exact emails        -> alice@example.com
//   - whole domains       -> @example.com   (or just example.com)
// The file is re-read on every check, so adding someone doesn't require a
// restart. If WHITELIST_PATH is unset, sign-in is open to everyone (default);
// if it is set but the file can't be read or holds no entry, nobody gets in
// (fail closed — a misconfigured allowlist must not silently open the app).

export function parseWhitelist(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.split("#")[0].trim().toLowerCase())
    .filter(Boolean);
}

export function matchesWhitelist(entries: string[], email: string): boolean {
  const e = email.trim().toLowerCase();
  const domain = e.split("@")[1] ?? "";

  return entries.some((entry) => {
    if (entry.startsWith("@")) return domain === entry.slice(1);
    if (!entry.includes("@")) return domain === entry; // bare domain
    return e === entry; // exact email
  });
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  const path = process.env.WHITELIST_PATH;
  if (!path || !path.trim()) return true;

  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch (err) {
    console.error(
      `[tierlistrr] WHITELIST_PATH (${path}) is unreadable — refusing every sign-in:`,
      err,
    );
    return false;
  }

  const entries = parseWhitelist(content);
  if (entries.length === 0) {
    console.warn(
      `[tierlistrr] the allowlist at ${path} is empty — nobody can sign in`,
    );
    return false;
  }

  return matchesWhitelist(entries, email);
}
