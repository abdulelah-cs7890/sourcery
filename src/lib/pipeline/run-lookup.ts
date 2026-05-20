import { eq } from "drizzle-orm";
import { db, lookups, matches } from "@/lib/db";
import { fetchTikTokMeta } from "@/lib/ingestion/tiktok-url";
import { IngestionError } from "@/lib/ingestion/types";
import { runMatchers } from "@/lib/matchers/run";
import type { ScoredMatch } from "@/lib/matchers/types";

export type PipelineMode = "url" | "caption";

export async function runLookup(
  lookupId: string,
  mode: PipelineMode,
  input: string,
): Promise<ScoredMatch[]> {
  await db
    .update(lookups)
    .set({ status: "processing" })
    .where(eq(lookups.id, lookupId));

  try {
    const caption =
      mode === "url" ? (await fetchTikTokMeta(input)).caption : input;

    await db
      .update(lookups)
      .set({ caption })
      .where(eq(lookups.id, lookupId));

    const results = await runMatchers(caption);

    if (results.length > 0) {
      await db.insert(matches).values(
        results.map((m, i) => ({
          lookupId,
          source: m.source,
          productUrl: m.productUrl,
          productKey: m.productKey,
          title: m.title,
          imageUrl: m.imageUrl,
          priceCents: m.priceCents,
          currency: m.currency,
          confidence: m.confidence,
          rankedIndex: i,
        })),
      );
    }

    await db
      .update(lookups)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(lookups.id, lookupId));

    return results;
  } catch (err) {
    const ingestionFailed = err instanceof IngestionError;
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(lookups)
      .set({
        status: "failed",
        errorMessage: ingestionFailed
          ? `ingestion:${err.code}:${message}`
          : message,
      })
      .where(eq(lookups.id, lookupId));
    throw err;
  }
}
