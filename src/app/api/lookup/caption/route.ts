import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, lookups } from "@/lib/db";
import { runLookup } from "@/lib/pipeline/run-lookup";
import { lookupRatelimit } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYNC_BUDGET_MS = 25_000;
const TIMEOUT_SENTINEL = Symbol("TIMEOUT");

const bodySchema = z.object({
  caption: z.string().trim().min(3).max(1000),
});

export async function POST(req: Request) {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("/api/lookup/caption top-level error", err);
    return NextResponse.json(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

async function handlePost(req: Request) {
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
      tiktokUrl: null,
      caption: parsed.data.caption,
      status: "pending",
    })
    .returning({ id: lookups.id });

  const lookupId = row.id;

  const pipelinePromise = runLookup(lookupId, "caption", parsed.data.caption);
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) =>
    setTimeout(() => resolve(TIMEOUT_SENTINEL), SYNC_BUDGET_MS),
  );

  try {
    const result = await Promise.race([pipelinePromise, timeoutPromise]);
    if (result === TIMEOUT_SENTINEL) {
      waitUntil(
        pipelinePromise.catch((e) =>
          console.error("Background caption lookup failed", lookupId, e),
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
