import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { recalcTrending } from "@/lib/trending/aggregate";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "cron disabled (CRON_SECRET not set)" },
      { status: 401 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const { inserted } = await recalcTrending();
  const durationMs = Date.now() - startedAt;

  return NextResponse.json({ ok: true, inserted, durationMs });
}
