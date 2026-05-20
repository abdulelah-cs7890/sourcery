import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, lookups } from "@/lib/db";
import { IngestionError } from "@/lib/ingestion/types";
import { runLookup } from "@/lib/pipeline/run-lookup";
import { lookupRatelimit } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYNC_BUDGET_MS = 25_000;
const TIMEOUT_SENTINEL = Symbol("TIMEOUT");

const bodySchema = z.object({
  tiktokUrl: z
    .string()
    .url()
    .refine(
      (v) => /tiktok\.com|vm\.tiktok\.com/.test(v),
      "Must be a TikTok URL",
    ),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { success, remaining } = await lookupRatelimit.limit(
    session.user.id,
  );
  if (!success) {
    return NextResponse.json(
      { error: "rate_limited", remaining },
      { status: 429 },
    );
  }

  const [row] = await db
    .insert(lookups)
    .values({
      userId: session.user.id,
      tiktokUrl: parsed.data.tiktokUrl,
      status: "pending",
    })
    .returning({ id: lookups.id });

  const lookupId = row.id;

  const pipelinePromise = runLookup(lookupId, "url", parsed.data.tiktokUrl);
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) =>
    setTimeout(() => resolve(TIMEOUT_SENTINEL), SYNC_BUDGET_MS),
  );

  try {
    const result = await Promise.race([pipelinePromise, timeoutPromise]);

    if (result === TIMEOUT_SENTINEL) {
      waitUntil(
        pipelinePromise.catch((e) =>
          console.error("Background lookup failed", lookupId, e),
        ),
      );
      return NextResponse.json({
        id: lookupId,
        status: "processing",
        async: true,
        remaining,
      });
    }

    return NextResponse.json({
      id: lookupId,
      status: "completed",
      matches: result,
      remaining,
    });
  } catch (err) {
    if (err instanceof IngestionError) {
      return NextResponse.json(
        {
          id: lookupId,
          status: "failed",
          reason: "ingestion_failed",
          code: err.code,
          retryWithCaption: true,
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      {
        id: lookupId,
        status: "failed",
        reason: "pipeline_error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
