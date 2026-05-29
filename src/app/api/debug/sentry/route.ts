import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Self-test endpoint: forces a thrown error that Sentry's
 * `captureRequestError` hook in [instrumentation.ts](instrumentation.ts)
 * should record. Gated by the existing CRON_SECRET so it can't be crawled
 * or hit by random visitors.
 *
 * Usage:
 *   curl -s "https://sourcery-khaki.vercel.app/api/debug/sentry?secret=$CRON_SECRET"
 * Then check the Sentry project dashboard for a fresh event tagged "debug".
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "debug disabled (CRON_SECRET not set)" },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Capture explicitly so the dashboard event is unambiguous.
  Sentry.captureMessage("Sourcery Sentry self-test: explicit captureMessage", {
    level: "info",
    tags: { source: "debug-endpoint" },
  });
  // And throw — exercises `onRequestError = Sentry.captureRequestError`.
  throw new Error(
    "Sourcery Sentry self-test: deliberate throw from /api/debug/sentry",
  );
}
