import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Sourcery",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] px-4 py-1.5 text-xs font-medium hover:border-[var(--color-border-strong)] transition"
      >
        ← Home
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-8 mb-2 text-[var(--color-text)]">
        Terms of Service
      </h1>
      <p className="text-sm text-[var(--color-text-faint)] mb-10">
        Last updated: 2026-05-22
      </p>

      <div className="space-y-10 text-sm text-[var(--color-text-muted)] leading-relaxed">
        <LegalSection title="1. What Sourcery is">
          Sourcery is a research and product-discovery tool. You paste a
          TikTok video URL; we surface publicly available product information
          from supplier directories (AliExpress, CJ Dropshipping) and
          third-party image search (Google Lens). Sourcery is intended to
          help you research products that already exist for sale online. It
          is not a tool for copying anyone&apos;s store, infringing
          intellectual property, or misrepresenting the origin of goods.
        </LegalSection>

        <LegalSection title="2. Acceptable use">
          <p>You agree not to use Sourcery to:</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
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
          <p className="mt-3">
            We reserve the right to suspend or terminate accounts that use
            Sourcery in ways inconsistent with these terms.
          </p>
        </LegalSection>

        <LegalSection title="3. Third-party content">
          Results returned by Sourcery come from public third-party sources
          (TikTok metadata, AliExpress public search, CJ Dropshipping&apos;s
          developer API, Google Lens). We do not host or warrant the
          accuracy, legality, or quality of any product surfaced. Verify
          suppliers, certifications, and IP status before purchasing or
          reselling.
        </LegalSection>

        <LegalSection title="4. Plans and billing">
          Free tier permits a limited number of lookups per day. Paid plans
          (Pro, Pro Plus) unlock higher limits and additional features
          described on the upgrade page at checkout. Subscriptions renew
          monthly until cancelled. Cancel any time via your account settings.
        </LegalSection>

        <LegalSection title="5. No warranty; limitation of liability">
          Sourcery is provided &quot;as is.&quot; We don&apos;t guarantee
          that any matched supplier is the genuine source of the product
          shown in a given TikTok video, that prices are current, or that
          results will be available without interruption. To the maximum
          extent permitted by law, our liability for any claim arising from
          your use of Sourcery is limited to the amount you paid us in the
          twelve months preceding the claim.
        </LegalSection>

        <LegalSection title="6. Changes">
          We may update these terms. Material changes will be communicated
          via email or in-app notice. Continued use after notice constitutes
          acceptance.
        </LegalSection>

        <LegalSection title="7. Contact">
          Questions or takedown requests: reply to any Sourcery email or
          reach the operator at the email used for your account.
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
