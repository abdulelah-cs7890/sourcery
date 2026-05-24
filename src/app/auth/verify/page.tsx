import Link from "next/link";

export const metadata = {
  title: "Check your email — Sourcery",
};

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20 sm:py-28 flex justify-center">
      <div className="w-full max-w-md">
        <div className="relative rounded-3xl border border-[var(--color-border)] bg-[radial-gradient(ellipse_at_top,#0d3a2d_0%,#08090c_70%)] p-8 sm:p-10 text-center">
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3.5 py-1.5 text-xs text-[var(--color-text-muted)]">
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)]"
              />
              Email sent
            </span>
          </div>

          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--color-accent)]"
                  aria-hidden
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)] mb-2">
            Check your inbox
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            We just sent a magic link to your email. Open it on this device to
            finish signing in.
          </p>

          <p className="text-xs text-[var(--color-text-faint)] mb-6">
            Didn&apos;t arrive? Check your spam folder, or try again in a moment.
          </p>

          <Link
            href="/signin"
            className="btn-outline inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
