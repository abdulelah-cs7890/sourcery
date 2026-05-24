import { eq } from "drizzle-orm";
import { db, lookups, matches } from "@/lib/db";
import { IngestionError } from "@/lib/ingestion/types";
import { runMatchers } from "@/lib/matchers/run";
import type { ScoredMatch } from "@/lib/matchers/types";

/**
 * Runs caption-based matchers and persists results to the lookup row.
 * The caller is responsible for already having a caption — Stream B's
 * ssstik path fetches it before invoking this; caption-paste passes it
 * directly; upload-with-caption does the same.
 */
export async function runLookup(
  lookupId: string,
  caption: string,
): Promise<ScoredMatch[]> {
  await db
    .update(lookups)
    .set({ status: "processing", caption })
    .where(eq(lookups.id, lookupId));

  try {
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
