import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LookupForm from "./lookup-form";

export default async function LookupPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/lookup");

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3.5 py-1.5 text-xs text-[var(--color-text-muted)] mb-5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)]" />
          New lookup
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)] mb-2">
          Find the source
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Paste a viral TikTok product URL, or drop the downloaded .mp4 for
          visual matching.
        </p>
      </div>

      <div className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[var(--color-emerald-glow)] opacity-15 blur-3xl"
        />
        <div className="relative z-10">
          <LookupForm />
        </div>
      </div>
    </main>
  );
}
