import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, lookups, matches } from "@/lib/db";
import CaptionFallback from "../caption-fallback";
import { type MatchUI } from "../match-list";
import LookupPoller from "./lookup-poller";

export default async function LookupResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/lookup");
  }

  const { id } = await params;

  const [lookup] = await db
    .select()
    .from(lookups)
    .where(and(eq(lookups.id, id), eq(lookups.userId, session.user.id)));

  if (!lookup) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-zinc-500 mb-4">Lookup not found.</p>
        <Link href="/lookup" className="text-sm underline">
          ← Try another
        </Link>
      </main>
    );
  }

  const matchRows =
    lookup.status === "completed"
      ? await db
          .select()
          .from(matches)
          .where(eq(matches.lookupId, id))
          .orderBy(asc(matches.rankedIndex))
      : [];

  const initialMatches: MatchUI[] = matchRows.map((m) => ({
    id: m.id,
    source: (m.source === "cj" ? "cj" : "aliexpress") as MatchUI["source"],
    productUrl: m.productUrl,
    title: m.title ?? "",
    imageUrl: m.imageUrl,
    priceCents: m.priceCents,
    currency: m.currency ?? "USD",
    confidence: m.confidence,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/lookup"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← New lookup
        </Link>
        <h1 className="text-2xl font-bold mt-2">Results</h1>
        {lookup.caption && (
          <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
            Caption:{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {lookup.caption}
            </span>
          </p>
        )}
      </div>

      {lookup.status !== "failed" && (
        <LookupPoller
          id={id}
          initialStatus={lookup.status as "pending" | "processing" | "completed"}
          initialMatches={initialMatches}
          initialFrameUrls={lookup.frameUrls ?? []}
          hasVideo={lookup.tiktokUrl !== null}
        />
      )}

      {lookup.status === "failed" && (
        <div className="space-y-6">
          <p className="text-sm text-red-700 dark:text-red-300">
            That lookup failed.
            {lookup.errorMessage && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {" "}
                ({lookup.errorMessage})
              </span>
            )}
          </p>
          <div>
            <h2 className="text-sm font-medium mb-2">
              Try pasting the caption instead
            </h2>
            <CaptionFallback />
          </div>
        </div>
      )}
    </main>
  );
}
