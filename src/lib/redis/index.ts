import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// TODO(week4c): drop back to 3 / 24h before Stripe paywall ships.
// Temporarily bumped to 50 so dev iteration on prod isn't blocked by the
// real free-tier limit while there's only one tester (the user).
export const lookupRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "24 h"),
  prefix: "sourcery:lookup",
  analytics: true,
});
