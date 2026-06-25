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

/** Build a Pollinations image URL from a full prompt (no API key required). */
export function pollinationsUrlForPrompt(
  prompt: string,
  seedKey: string,
  opts: { size?: number; model?: string } = {},
): string {
  const size = opts.size ?? 512;
  const model = opts.model ?? "flux";
  const base = (
    process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai"
  ).replace(/\/$/, "");
  const seed = seedFrom(seedKey);
  const params = new URLSearchParams({
    width: String(size),
    height: String(size),
    seed: String(seed),
    model,
    nologo: "true",
  });
  return `${base}/prompt/${encodeURIComponent(prompt)}?${params}`;
}

/** Mechanical fallback prompt (no LLM): the name framed by the list's topic. */
function mechanicalPrompt(name: string, topic: string): string {
  return `${name}, ${topic}, professional product photo, centered subject, studio lighting, clean background, high detail`;
}

/** Build a free Pollinations image URL for an item (sync, mechanical prompt). */
export function buildPollinationsUrl(
  name: string,
  topic: string,
  opts: { size?: number; model?: string } = {},
): string {
  return pollinationsUrlForPrompt(mechanicalPrompt(name, topic), `${topic}:${name}`, opts);
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

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Minimal OpenAI-compatible chat call (Groq by default). Returns the content. */
async function groqChat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number } = {},
): Promise<string> {
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
        temperature: opts.temperature ?? 0.8,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages,
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
    return json.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

/** Ask the LLM for `count` item names on a topic. Throws on misconfig/failure. */
export async function generateItemNames(
  topic: string,
  count: number,
): Promise<string[]> {
  const content = await groqChat(
    [
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
    { json: true },
  );
  const names = parseItemNames(content, count);
  if (names.length === 0) {
    throw new Error("L'IA n'a renvoyé aucun élément exploitable.");
  }
  return names;
}

/**
 * Build an image prompt for an item that respects the list's topic — e.g.
 * "chèvre" in a "Fromages" list must be goat *cheese*, not the animal.
 * Uses the LLM when configured, otherwise falls back to a mechanical prompt.
 */
export async function imagePromptFor(name: string, topic: string): Promise<string> {
  const fallback = mechanicalPrompt(name, topic);
  if (!isAiConfigured()) return fallback;
  try {
    const content = await groqChat(
      [
        {
          role: "system",
          content:
            "You write short English prompts for an image generator. Reply with the prompt only, a single line, no quotes.",
        },
        {
          role: "user",
          content: `Tier list topic: "${topic}". Item: "${name}". Write an image prompt depicting THIS item as a member of the topic's category — e.g. if the topic is "Fromages" and the item is "chèvre", it is goat CHEESE (not the animal); "buche de chèvre" is a goat cheese log. Style: close-up product photo, clean neutral background, studio lighting, appetizing, high detail. One single line.`,
        },
      ],
      { temperature: 0.5 },
    );
    const line = content.trim().split("\n")[0].replace(/^["']|["']$/g, "").slice(0, 300);
    return line || fallback;
  } catch {
    return fallback;
  }
}
