import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const ctaHref = session?.user ? "/lookup" : "/signin?callbackUrl=/lookup";
  const ctaLabel = session?.user ? "Open your dashboard →" : "Try Sourcery free →";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-hero-radial mt-6 sm:mt-10 px-6 sm:px-10 py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-dotgrid opacity-40"
        />
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)]/70 backdrop-blur px-3.5 py-1.5 text-xs text-[var(--color-text-muted)] mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)]" />
            Find the actual TikTok source
          </span>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance text-[var(--color-text)]">
            Skip the spy tools.
            <br />
            <span className="text-[var(--color-accent)]">Find the source.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg text-[var(--color-text-muted)] text-balance">
            Paste a viral TikTok URL or drop the video. Sourcery returns the
            AliExpress / CJ Dropshipping supplier, real prices, and a Google
            Lens reverse-search of the actual video keyframes.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={ctaHref}
              className="btn-lime rounded-full px-6 py-3 text-sm font-semibold"
            >
              {ctaLabel}
            </Link>
            <a
              href="https://github.com/abdulelah-cs7890/sourcery"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline rounded-full px-6 py-3 text-sm font-medium"
            >
              View on GitHub
            </a>
          </div>

          <p className="mt-5 text-xs text-[var(--color-text-faint)]">
            Free tier: 10 lookups per day. No card required.
          </p>
        </div>
      </section>

      {/* ── Logos / trust row ───────────────────────────────── */}
      <section className="mt-12 sm:mt-16">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--color-text-faint)] mb-6">
          Built on the modern stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-[var(--color-text-muted)]">
          <StackBadge label="Next.js 16" />
          <StackBadge label="Vercel" />
          <StackBadge label="Neon Postgres" />
          <StackBadge label="Upstash Redis" />
          <StackBadge label="Auth.js v5" />
          <StackBadge label="Sentry" />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how" className="mt-24 sm:mt-32 scroll-mt-20">
        <div className="text-center mb-12">
          <p className="text-sm text-[var(--color-accent)] font-medium mb-2">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Three steps from URL to supplier
          </h2>
          <p className="mt-4 text-[var(--color-text-muted)] max-w-2xl mx-auto">
            No ad libraries. No 3-week-old data. You point at what&apos;s viral
            right now — Sourcery does the rest in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard
            n="01"
            title="Paste a URL or drop the video"
            body="Any TikTok product video. When TikTok blocks our backend, drop the downloaded .mp4 and keep going."
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
          />
          <StepCard
            n="02"
            title="We hunt the supplier"
            body="AliExpress and CJ Dropshipping searched in parallel. Top 3 ranked by keyword overlap and dropship-plausible pricing."
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            }
          />
          <StepCard
            n="03"
            title="Reverse-search the video"
            body="Five keyframes extracted in your browser. Click any to open Google Lens with that exact frame loaded."
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Why ─────────────────────────────────────────────── */}
      <section className="mt-24 sm:mt-32">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-8 sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-emerald-glow)] opacity-20 blur-3xl"
          />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-1 text-xs text-[var(--color-text-muted)] mb-4">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                Why Sourcery
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-4">
                Spy tools ship you ads from three weeks ago.
              </h2>
              <p className="text-[var(--color-text-muted)] text-balance">
                Sourcery shows you the supplier of what&apos;s viral{" "}
                <span className="text-[var(--color-accent)] font-medium">
                  right now
                </span>
                . The long-term moat is a trending board built bottom-up from
                real user lookups — a winners list you can&apos;t get anywhere
                else.
              </p>
              <div className="mt-6">
                <Link
                  href={ctaHref}
                  className="btn-lime inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <FeaturePill
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                }
                label="Sub-30 second pipeline"
              />
              <FeaturePill
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 5c0-1.66 4-3 9-3s9 1.34 9 3-4 3-9 3-9-1.34-9-3z" />
                  </svg>
                }
                label="Fresh data — not ad-library leftovers"
              />
              <FeaturePill
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                }
                label="Visual matching via Google Lens"
              />
              <FeaturePill
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 2v20" />
                    <path d="m17 5-5-3-5 3" />
                    <path d="m17 19-5 3-5-3" />
                    <path d="M2 12h20" />
                  </svg>
                }
                label="Live trending board"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="mt-24 sm:mt-32 mb-10 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
          Find the source.{" "}
          <span className="text-[var(--color-accent)]">Faster. Smarter.</span>
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)] max-w-xl mx-auto">
          Free tier, no card. 10 lookups per day.
        </p>
        <div className="mt-8">
          <Link
            href={ctaHref}
            className="btn-lime inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}

function StackBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
      <span
        aria-hidden
        className="inline-block w-1 h-1 rounded-full bg-[var(--color-accent)]"
      />
      <span className="font-medium tracking-tight">{label}</span>
    </span>
  );
}

function StepCard({
  n,
  title,
  body,
  icon,
}: {
  n: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 hover:border-[var(--color-border-strong)] transition">
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
          {icon}
        </div>
        <span className="text-xs font-mono text-[var(--color-text-faint)] tracking-tight">
          {n}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-[var(--color-text)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
        {body}
      </p>
    </article>
  );
}

function FeaturePill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 backdrop-blur px-4 py-3 text-sm">
      <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
        {icon}
      </span>
      <span className="text-[var(--color-text)]">{label}</span>
    </div>
  );
}
