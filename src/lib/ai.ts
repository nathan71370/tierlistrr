// AI pre-fill: generate item names with an OpenAI-compatible LLM (Groq by
// default) and free, key-less images from Pollinations.
//
// Configure via env:
//   GROQ_API_KEY   (required to enable generation)
//   GROQ_MODEL     (default: llama-3.3-70b-versatile)
//   GROQ_BASE_URL  (default: https://api.groq.com/openai/v1)
//
// Network calls live behind isAiConfigured() so the rest of the app degrades
// gracefully when no key is present.

export function isAiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/** Deterministic small positive integer from a string (stable image seeds). */
export function seedFrom(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1_000_000;
}

/** Build a free Pollinations image URL for an item (no API key required). */
export function buildPollinationsUrl(
  name: string,
  topic: string,
  opts: { size?: number; model?: string } = {},
): string {
  const size = opts.size ?? 512;
  const model = opts.model ?? "flux";
  const base = (
    process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai"
  ).replace(/\/$/, "");
  const prompt = `${name}, ${topic}, professional product photo, centered subject, studio lighting, clean background, high detail`;
  const seed = seedFrom(`${topic}:${name}`);
  const params = new URLSearchParams({
    width: String(size),
    height: String(size),
    seed: String(seed),
    model,
    nologo: "true",
  });
  return `${base}/prompt/${encodeURIComponent(prompt)}?${params}`;
}

/**
 * Extract a clean list of item names from a raw LLM response. Tolerant of code
 * fences, a wrapping {"items": [...]} object, or a bare JSON array.
 */
export function parseItemNames(raw: string, max: number): string[] {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    const arr = cleaned.match(/\[[\s\S]*\]/);
    if (arr) {
      try {
        data = JSON.parse(arr[0]);
      } catch {
        data = null;
      }
    }
  }

  let list: unknown[] = [];
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const key = Object.keys(obj).find((k) => Array.isArray(obj[k]));
    if (key) list = obj[key] as unknown[];
  }

  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of list) {
    const name =
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object" && "name" in entry
          ? String((entry as { name: unknown }).name ?? "")
          : "";
    const trimmed = name.replace(/^\s*[-*\d.]+\s*/, "").trim().slice(0, 80);
    const dedupeKey = trimmed.toLowerCase();
    if (trimmed && !seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      names.push(trimmed);
    }
    if (names.length >= max) break;
  }
  return names;
}

/** Ask the LLM for `count` item names on a topic. Throws on misconfig/failure. */
export async function generateItemNames(
  topic: string,
  count: number,
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "L'IA n'est pas configurée. Ajoute une variable d'environnement GROQ_API_KEY.",
    );
  }
  const baseUrl = process.env.GROQ_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu génères des éléments pour des tier lists. Tu réponds uniquement en JSON valide, sans commentaire.",
          },
          {
            role: "user",
            content: `Donne exactement ${count} éléments concrets, connus et variés pour une tier list sur le thème : "${topic}". Réponds en JSON strict de la forme {"items": ["nom1", "nom2"]}. Noms courts, pas de numéros, pas de doublons.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Échec de l'appel à l'IA (${res.status}). ${detail.slice(0, 200)}`,
      );
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const names = parseItemNames(content, count);
    if (names.length === 0) {
      throw new Error("L'IA n'a renvoyé aucun élément exploitable.");
    }
    return names;
  } finally {
    clearTimeout(timeout);
  }
}
