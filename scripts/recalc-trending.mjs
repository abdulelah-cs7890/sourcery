// One-shot trending recalculation — runs the same query as the nightly cron
// without needing a live HTTP request. Useful for seeding /trending after
// you've done a batch of lookups, or for re-running locally without env vars.
//
// Run: node --env-file=.env.local scripts/recalc-trending.mjs

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("Wiping trending_agg…");
await sql`DELETE FROM trending_agg`;

console.log("Recomputing from last 7 days of completed lookups…");
const inserted = await sql`
  INSERT INTO trending_agg (
    product_key, source, product_url, title, image_url,
    lookup_count, unique_user_count, first_seen, last_seen
  )
  SELECT
    m.product_key,
    MAX(m.source)                  AS source,
    MAX(m.product_url)             AS product_url,
    MAX(m.title)                   AS title,
    MAX(m.image_url)               AS image_url,
    COUNT(*)::int                  AS lookup_count,
    COUNT(DISTINCT l.user_id)::int AS unique_user_count,
    MIN(l.created_at)              AS first_seen,
    MAX(l.created_at)              AS last_seen
  FROM matches m
  INNER JOIN lookups l ON l.id = m.lookup_id
  WHERE l.created_at > NOW() - INTERVAL '7 days'
    AND l.status = 'completed'
  GROUP BY m.product_key
  RETURNING product_key
`;

console.log(`Inserted ${inserted.length} trending row(s).`);
if (inserted.length === 0) {
  console.log(
    "Nothing to aggregate. Run a few real lookups first, then re-run this script.",
  );
}
