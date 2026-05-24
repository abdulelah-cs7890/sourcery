import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block w-4 h-4 rounded-[4px] bg-[var(--color-accent)]"
          />
          <span>© 2026 Sourcery</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/legal/terms"
            className="hover:text-[var(--color-text)] transition"
          >
            Terms
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-[var(--color-text)] transition"
          >
            Privacy
          </Link>
          <a
            href="https://github.com/abdulelah-cs7890/sourcery"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-text)] transition"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
