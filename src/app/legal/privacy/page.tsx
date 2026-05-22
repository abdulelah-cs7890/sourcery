import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Sourcery",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-10">Last updated: 2026-05-22</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            What we collect
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Your email</strong> — required to sign in via magic
              link.
            </li>
            <li>
              <strong>The TikTok URLs you submit</strong> and the resulting
              caption + supplier matches we found for you.
            </li>
            <li>
              <strong>Video keyframes</strong> extracted from submitted videos
              (hosted publicly so Google Lens can fetch them; not linked to
              your identity in public URLs).
            </li>
            <li>
              <strong>Subscription metadata</strong> if you upgrade to a paid
              plan (handled by Stripe; we store your Stripe customer ID and
              plan status, not your card details).
            </li>
            <li>
              <strong>Server logs</strong> with anonymized IP and user-agent
              for security and debugging (retained briefly).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            How we use it
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>To deliver supplier matches in response to your lookups.</li>
            <li>To enforce free-tier rate limits.</li>
            <li>To aggregate trending products across all users (no individual lookup is identifiable in the trending board).</li>
            <li>To send transactional emails (magic-link sign-in) and, if you&apos;re on a paid or early-access plan, an optional weekly digest of trending products.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            Third parties we use
          </h2>
          <p>
            Sourcery is a small operation built on standard hosted services.
            Each of these processes some of your data on our behalf:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Vercel</strong> — application hosting, serverless
              functions, image hosting (Vercel Blob).
            </li>
            <li>
              <strong>Neon</strong> — Postgres database (your account + lookup
              records).
            </li>
            <li>
              <strong>Upstash</strong> — Redis (rate-limit counters).
            </li>
            <li>
              <strong>Resend</strong> — email delivery for magic links and the
              weekly digest.
            </li>
            <li>
              <strong>Sentry</strong> — error tracking (no personally
              identifying information sent intentionally; stack traces may
              include URLs).
            </li>
            <li>
              <strong>Stripe</strong> — payment processing for paid plans.
            </li>
            <li>
              <strong>CJ Dropshipping</strong> — supplier API queried with
              your search keywords.
            </li>
            <li>
              <strong>AliExpress</strong> — public search pages queried with
              your search keywords.
            </li>
            <li>
              <strong>Google Lens</strong> — invoked only when you click a
              keyframe thumbnail (we do not call any Google API; you
              navigate there yourself).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            Cookies
          </h2>
          <p>
            We use a single first-party authentication cookie (Auth.js
            session) to keep you signed in. No advertising or cross-site
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            Your rights
          </h2>
          <p>
            Request export or deletion of your account data by replying to any
            Sourcery email. Deletion removes your account, lookup history, and
            associated keyframes. Aggregated trending data does not include
            individual identifiers and remains.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            Changes
          </h2>
          <p>
            We may update this policy. Material changes will be communicated
            via email or in-app notice.
          </p>
        </section>
      </div>
    </main>
  );
}
