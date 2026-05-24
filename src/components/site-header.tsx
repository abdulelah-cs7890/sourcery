import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function SiteHeader() {
  const session = await auth();
  const signedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            aria-hidden
            className="inline-block w-5 h-5 rounded-[5px] bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)] group-hover:scale-110 transition"
          />
          <span className="font-semibold tracking-tight text-[var(--color-text)]">
            Sourcery
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-[var(--color-text-muted)]">
          <Link href="/#how" className="hover:text-[var(--color-text)] transition">
            How it works
          </Link>
          <Link
            href="/lookup"
            className="hover:text-[var(--color-text)] transition"
          >
            Lookup
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

        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Link
                href="/lookup"
                className="hidden sm:inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] px-4 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)] transition"
              >
                Lookup →
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-4 py-1.5 text-sm font-medium shadow-[var(--shadow-glow-lime)] hover:bg-[var(--color-accent-hover)] transition"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden sm:inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] px-4 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)] transition"
              >
                Sign in
              </Link>
              <Link
                href="/signin?callbackUrl=/lookup"
                className="rounded-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-4 py-1.5 text-sm font-medium shadow-[var(--shadow-glow-lime)] hover:bg-[var(--color-accent-hover)] transition"
              >
                Try it free →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
