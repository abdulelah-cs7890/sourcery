// Clears Upstash keys under the sourcery:lookup prefix so the 3/24h window
// starts fresh. Useful during testing when you've already burned your quota.
// Run: node --env-file=.env.local scripts/reset-ratelimit.mjs
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const pattern = "sourcery:lookup*";
const keys = await redis.keys(pattern);
console.log(`Matched ${keys.length} key(s):`, keys);
if (keys.length > 0) {
  const deleted = await redis.del(...keys);
  console.log(`Deleted ${deleted} key(s).`);
} else {
  console.log("Nothing to delete.");
}
