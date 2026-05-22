import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Sourcery",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-10">Last updated: 2026-05-22</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            1. What Sourcery is
          </h2>
          <p>
            Sourcery is a research and product-discovery tool. You paste a
            TikTok video URL; we surface publicly available product information
            from supplier directories (AliExpress, CJ Dropshipping) and
            third-party image search (Google Lens). Sourcery is intended to
            help you research products that already exist for sale online. It
            is not a tool for copying anyone&apos;s store, infringing
            intellectual property, or misrepresenting the origin of goods.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            2. Acceptable use
          </h2>
          <p>You agree not to use Sourcery to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Reproduce or pass off another seller&apos;s branded content,
              copyrighted media, or trademarked imagery as your own.
            </li>
            <li>
              Sell counterfeit products or items that infringe a third
              party&apos;s intellectual property.
            </li>
            <li>
              Make false claims about product origin, authenticity, or
              endorsement.
            </li>
            <li>
              Automate, scrape, or otherwise abuse the service beyond the rate
              limits we publish.
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that use
            Sourcery in ways inconsistent with these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            3. Third-party content
          </h2>
          <p>
            Results returned by Sourcery come from public third-party sources
            (TikTok metadata, AliExpress public search, CJ Dropshipping&apos;s
            developer API, Google Lens). We do not host or warrant the
            accuracy, legality, or quality of any product surfaced. Verify
            suppliers, certifications, and IP status before purchasing or
            reselling.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            4. Plans and billing
          </h2>
          <p>
            Free tier permits a limited number of lookups per day. Paid plans
            (Pro, Pro Plus) unlock higher limits and additional features
            described on the upgrade page at checkout. Subscriptions renew
            monthly until cancelled. Cancel any time via your account
            settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            5. No warranty; limitation of liability
          </h2>
          <p>
            Sourcery is provided &quot;as is.&quot; We don&apos;t guarantee
            that any matched supplier is the genuine source of the product
            shown in a given TikTok video, that prices are current, or that
            results will be available without interruption. To the maximum
            extent permitted by law, our liability for any claim arising from
            your use of Sourcery is limited to the amount you paid us in the
            twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            6. Changes
          </h2>
          <p>
            We may update these terms. Material changes will be communicated
            via email or in-app notice. Continued use after notice constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-8 mb-2 text-zinc-900 dark:text-zinc-100">
            7. Contact
          </h2>
          <p>
            Questions or takedown requests: reply to any Sourcery email or
            reach the operator at the email used for your account.
          </p>
        </section>
      </div>
    </main>
  );
}
