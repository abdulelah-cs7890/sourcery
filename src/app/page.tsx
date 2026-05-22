import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const ctaHref = session?.user
    ? "/lookup"
    : "/api/auth/signin?callbackUrl=/lookup";
  const ctaLabel = session?.user ? "Open your dashboard" : "Try it free →";

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 pt-20 sm:pt-28 pb-16 text-center">
          <p className="text-sm font-medium text-zinc-500 mb-4">Sourcery</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6 text-balance">
            Find the source of any viral TikTok product in 10 seconds.
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto text-balance">
            Paste a TikTok URL → get the AliExpress / CJ Dropshipping supplier,
            real prices, and a Google Lens reverse-search of the actual video
            frames.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-base font-medium hover:opacity-90 transition"
          >
            {ctaLabel}
          </Link>
          <p className="text-xs text-zinc-500 mt-4">
            Free tier: 3 lookups per day. No card required.
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              n={1}
              title="Paste the TikTok URL"
              body="Any product video. We pull the caption and keyframes from the actual video — not 3-week-old ad libraries."
            />
            <Step
              n={2}
              title="We hunt the supplier"
              body="AliExpress + CJ Dropshipping searched in parallel. Top 3 candidates ranked by keyword overlap and dropship-plausible pricing."
            />
            <Step
              n={3}
              title="Reverse-search the video"
              body="When the caption is generic, click any keyframe to open Google Lens with the exact frame loaded — visually find the product."
            />
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-center mb-6">
            Why Sourcery
          </h2>
          <p className="text-center text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-balance">
            Other spy tools show you ads from three weeks ago. Sourcery shows
            you the supplier of what&apos;s viral{" "}
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              right now
            </span>
            . A trending board built bottom-up from real user lookups is
            coming next — a winners list you can&apos;t get anywhere else.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2026 Sourcery</p>
          <nav className="flex gap-6 text-sm">
            <Link
              href="/legal/terms"
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-zinc-400 text-xs uppercase tracking-wide mb-2">
        Step {n}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {body}
      </p>
    </div>
  );
}
