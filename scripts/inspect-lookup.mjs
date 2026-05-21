// One-shot: inspect the most recent lookup row in Neon.
// Run: node --env-file=.env.local scripts/inspect-lookup.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, status, caption, frame_urls, error_message, created_at, completed_at
  FROM lookups
  ORDER BY created_at DESC
  LIMIT 3
`;

for (const r of rows) {
  console.log("─────────────────────────────");
  console.log("id:           ", r.id);
  console.log("status:       ", r.status);
  console.log("caption:      ", String(r.caption ?? "").slice(0, 80));
  console.log("frame_urls:   ", r.frame_urls);
  console.log("error_message:", r.error_message);
  console.log("created_at:   ", r.created_at);
  console.log("completed_at: ", r.completed_at);
}
