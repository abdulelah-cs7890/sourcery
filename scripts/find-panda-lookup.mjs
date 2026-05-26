// Find the most recent panda night light lookup with AliExpress matches —
// the user's live-session screenshot showed a 53% match, which means
// AliExpress returned actual panda lamps. Use that lookup id for the
// README capture instead of forcing a fresh lookup (which is non-deterministic).
//
// Run: node --env-file=.env.local scripts/find-panda-lookup.mjs

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT l.id, l.tiktok_url, l.created_at, COUNT(m.id) AS match_count,
         STRING_AGG(m.source || ':' || m.title || ' (' || m.confidence || '%)', ' | ') AS matches
  FROM lookups l
  JOIN matches m ON l.id = m.lookup_id
  WHERE l.tiktok_url LIKE '%lummilux%7394481180319501611%'
    AND l.status = 'completed'
  GROUP BY l.id, l.tiktok_url, l.created_at
  ORDER BY l.created_at DESC
  LIMIT 10
`;

for (const r of rows) {
  console.log("---");
  console.log("id:", r.id);
  console.log("created:", r.created_at);
  console.log("match_count:", r.match_count);
  console.log("matches:", r.matches);
}
