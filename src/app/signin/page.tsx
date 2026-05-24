import Link from "next/link";
import { signIn } from "@/auth";

export const metadata = {
  title: "Sign in — Sourcery",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = callbackUrl || "/lookup";

  return (
    <main className="mx-auto max-w-6xl px-6 py-20 sm:py-28 flex justify-center">
      <div className="w-full max-w-md">
        <div className="relative rounded-3xl border border-[var(--color-border)] bg-[radial-gradient(ellipse_at_top,#0d3a2d_0%,#08090c_70%)] p-8 sm:p-10">
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3.5 py-1.5 text-xs text-[var(--color-text-muted)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)]" />
              Magic link sign-in
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-[var(--color-text)] mb-2">
            Welcome to Sourcery
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-8">
            We&apos;ll email you a link — no password needed.
          </p>

          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("resend", {
                email: formData.get("email") as string,
                redirectTo,
              });
            }}
            className="space-y-3"
          >
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow-lime)] transition"
            />
            <button
              type="submit"
              className="btn-lime w-full rounded-full px-5 py-3 text-sm font-medium"
            >
              Send magic link →
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-950/40 border border-red-900 text-red-300 px-3 py-2 text-xs text-center">
              {decodeURIComponent(error)}
            </p>
          )}

          <p className="text-xs text-[var(--color-text-faint)] text-center mt-8">
            By signing in you agree to our{" "}
            <Link
              href="/legal/terms"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
