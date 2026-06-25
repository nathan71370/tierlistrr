import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items, tierlists } from "@/db/schema";
import { imagePromptFor, pollinationsUrlForPrompt } from "@/lib/ai";
import { downloadImage } from "@/lib/images";

// In-process background image generator. Items are created instantly with
// image_status='pending'; this worker fetches each image (bounded concurrency,
// rate-limit friendly) and flips the row to 'ready' or 'failed'. Good for a
// single long-running container; a multi-replica setup would want a real queue.

type Job = { itemId: string; name: string; topic: string };

const CONCURRENCY = Number(process.env.IMAGE_CONCURRENCY) || 2;

type QueueState = {
  queue: Job[];
  active: number;
  seen: Set<string>;
  resumed: boolean;
};

declare global {
  var __tierlistrr_imgq__: QueueState | undefined;
}

const state: QueueState =
  globalThis.__tierlistrr_imgq__ ?? {
    queue: [],
    active: 0,
    seen: new Set(),
    resumed: false,
  };
globalThis.__tierlistrr_imgq__ = state;

async function processOne(job: Job) {
  // Topic-aware prompt: "chèvre" in a "Fromages" list → goat cheese, not a goat.
  const prompt = await imagePromptFor(job.name, job.topic);
  const url = pollinationsUrlForPrompt(prompt, `${job.topic}:${job.name}`);
  const localPath = await downloadImage(url);
  await db
    .update(items)
    .set(
      localPath
        ? { imagePath: localPath, imageStatus: "ready" }
        : { imageStatus: "failed" },
    )
    .where(eq(items.id, job.itemId));
}

function pump() {
  while (state.active < CONCURRENCY && state.queue.length > 0) {
    const job = state.queue.shift()!;
    state.active++;
    processOne(job)
      .catch(() => {})
      .finally(() => {
        state.seen.delete(job.itemId);
        state.active--;
        pump();
      });
  }
}

export function enqueueImage(job: Job) {
  if (state.seen.has(job.itemId)) return;
  state.seen.add(job.itemId);
  state.queue.push(job);
  pump();
}

/** Re-enqueue any items left 'pending' (e.g. after a restart). Runs once. */
export async function resumePending() {
  if (state.resumed) return;
  state.resumed = true;
  try {
    const rows = await db
      .select({
        itemId: items.id,
        name: items.name,
        topic: tierlists.title,
      })
      .from(items)
      .innerJoin(tierlists, eq(items.tierlistId, tierlists.id))
      .where(eq(items.imageStatus, "pending"));
    for (const r of rows) {
      enqueueImage({ itemId: r.itemId, name: r.name, topic: r.topic });
    }
  } catch {
    // best-effort
  }
}

// Sweep for unfinished work shortly after the module first loads.
if (!state.resumed) {
  setTimeout(() => {
    void resumePending();
  }, 1500);
}
