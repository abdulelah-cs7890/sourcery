import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// TODO(week2): drop back to 3 / 24h before final verification.
// Temporarily bumped to 50 for dev iteration after the user proved 3/24h works.
export const lookupRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "24 h"),
  prefix: "sourcery:lookup",
  analytics: true,
});
