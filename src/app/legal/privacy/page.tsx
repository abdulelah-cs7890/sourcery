import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Sourcery",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="btn-outline inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
      >
        ← Home
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-8 mb-2 text-[var(--color-text)]">
        Privacy Policy
      </h1>
      <p className="text-sm text-[var(--color-text-faint)] mb-10">
        Last updated: 2026-05-22
      </p>

      <div className="space-y-10 text-sm text-[var(--color-text-muted)] leading-relaxed">
        <LegalSection title="What we collect">
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-[var(--color-text)]">Your email</strong> —
              required to sign in via magic link.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">
                The TikTok URLs you submit
              </strong>{" "}
              and the resulting caption + supplier matches we found for you.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Video keyframes</strong>{" "}
              extracted from submitted videos (hosted publicly so Google Lens
              can fetch them; not linked to your identity in public URLs).
            </li>
            <li>
              <strong className="text-[var(--color-text)]">
                Subscription metadata
              </strong>{" "}
              if you upgrade to a paid plan (handled by Stripe; we store your
              Stripe customer ID and plan status, not your card details).
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Server logs</strong> with
              anonymized IP and user-agent for security and debugging (retained
              briefly).
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="How we use it">
          <ul className="list-disc ml-6 space-y-2">
            <li>To deliver supplier matches in response to your lookups.</li>
            <li>To enforce free-tier rate limits.</li>
            <li>
              To aggregate trending products across all users (no individual
              lookup is identifiable in the trending board).
            </li>
            <li>
              To send transactional emails (magic-link sign-in) and, if
              you&apos;re on a paid or early-access plan, an optional weekly
              digest of trending products.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Third parties we use">
          <p>
            Sourcery is a small operation built on standard hosted services.
            Each of these processes some of your data on our behalf:
          </p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li>
              <strong className="text-[var(--color-text)]">Vercel</strong> —
              application hosting, serverless functions, image hosting (Vercel
              Blob).
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Neon</strong> — Postgres
              database (your account + lookup records).
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Upstash</strong> — Redis
              (rate-limit counters).
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Resend</strong> — email
              delivery for magic links and the weekly digest.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Sentry</strong> — error
              tracking (no personally identifying information sent
              intentionally; stack traces may include URLs).
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Stripe</strong> — payment
              processing for paid plans.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">CJ Dropshipping</strong>{" "}
              — supplier API queried with your search keywords.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">AliExpress</strong> —
              public search pages queried with your search keywords.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Google Lens</strong> —
              invoked only when you click a keyframe thumbnail (we do not call
              any Google API; you navigate there yourself).
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Cookies">
          We use a single first-party authentication cookie (Auth.js session)
          to keep you signed in. No advertising or cross-site tracking cookies.
        </LegalSection>

        <LegalSection title="Your rights">
          Request export or deletion of your account data by replying to any
          Sourcery email. Deletion removes your account, lookup history, and
          associated keyframes. Aggregated trending data does not include
          individual identifiers and remains.
        </LegalSection>

        <LegalSection title="Changes">
          We may update this policy. Material changes will be communicated via
          email or in-app notice.
        </LegalSection>
      </div>
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
