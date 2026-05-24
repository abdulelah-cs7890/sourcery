import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Wipe + rebuild the trending_agg table from the last 7 days of completed
 * matches. Idempotent. Runs nightly via Vercel Cron, or on-demand via
 * `POST /api/cron/recalc-trending`.
 *
 * Returns the number of products in the new snapshot.
 */
export async function recalcTrending(): Promise<{ inserted: number }> {
  await db.execute(sql`DELETE FROM trending_agg`);

  const result = await db.execute(sql`
    INSERT INTO trending_agg (
      product_key, source, product_url, title, image_url,
      lookup_count, unique_user_count, first_seen, last_seen
    )
    SELECT
      m.product_key,
      MAX(m.source)                          AS source,
      MAX(m.product_url)                     AS product_url,
      MAX(m.title)                           AS title,
      MAX(m.image_url)                       AS image_url,
      COUNT(*)::int                          AS lookup_count,
      COUNT(DISTINCT l.user_id)::int         AS unique_user_count,
      MIN(l.created_at)                      AS first_seen,
      MAX(l.created_at)                      AS last_seen
    FROM matches m
    INNER JOIN lookups l ON l.id = m.lookup_id
    WHERE l.created_at > NOW() - INTERVAL '7 days'
      AND l.status = 'completed'
    GROUP BY m.product_key
  `);

  return { inserted: result.rowCount ?? 0 };
}
