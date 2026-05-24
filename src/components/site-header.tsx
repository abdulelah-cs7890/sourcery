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
          <Link
            href="/trending"
            className="hover:text-[var(--color-text)] transition"
          >
            Trending
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
                className="btn-outline hidden sm:inline-flex rounded-full px-4 py-1.5 text-sm font-medium"
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
                  className="btn-lime rounded-full px-4 py-1.5 text-sm font-medium"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="btn-outline hidden sm:inline-flex rounded-full px-4 py-1.5 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/signin?callbackUrl=/lookup"
                className="btn-lime rounded-full px-4 py-1.5 text-sm font-medium"
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
