import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, lookups, matches } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [lookup] = await db
    .select()
    .from(lookups)
    .where(and(eq(lookups.id, id), eq(lookups.userId, session.user.id)));

  if (!lookup) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const matchRows =
    lookup.status === "completed"
      ? await db
          .select()
          .from(matches)
          .where(eq(matches.lookupId, id))
          .orderBy(asc(matches.rankedIndex))
      : [];

  return NextResponse.json({
    id: lookup.id,
    status: lookup.status,
    caption: lookup.caption,
    tiktokUrl: lookup.tiktokUrl,
    videoBlobUrl: lookup.videoBlobUrl,
    errorMessage: lookup.errorMessage,
    frameUrls: lookup.frameUrls ?? [],
    matches: matchRows,
  });
}
