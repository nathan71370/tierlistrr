import { customAlphabet } from "nanoid";

// url-safe, lowercase, unambiguous-ish.
export const shortId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

export function slugify(title: string): string {
  const base =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // strip accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tierlist";
  return `${base}-${shortId()}`;
}
