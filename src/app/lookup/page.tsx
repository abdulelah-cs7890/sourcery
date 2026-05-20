import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import LookupForm from "./lookup-form";

export default async function LookupPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/lookup");

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Sourcery</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            sign out ({session.user.email})
          </button>
        </form>
      </div>
      <p className="text-sm text-zinc-500 mb-8">
        Paste a viral TikTok product URL → find the AliExpress source.
      </p>
      <LookupForm />
    </main>
  );
}
