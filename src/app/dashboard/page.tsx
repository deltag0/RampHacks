import Link from "next/link";
import { redirect } from "next/navigation";
import { House, MessageCircle } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/auth/login");
  }

  const [{ data: member }, { data: trust }, params] = await Promise.all([
    supabase
      .from("members")
      .select("display_name, joined_at")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("member_trust_summaries")
      .select(
        "trust_score, rating_average, rating_count, completed_exchange_count, verified_signal_count",
      )
      .eq("member_id", claims.sub)
      .maybeSingle(),
    searchParams,
  ]);

  const displayName =
    member?.display_name ??
    (typeof claims.email === "string" ? claims.email.split("@")[0] : "Member");

  const metrics = [
    ["Trust score", `${trust?.trust_score ?? 20}/100`],
    [
      "Member rating",
      trust?.rating_average ? `${trust.rating_average}/5` : "No ratings yet",
    ],
    ["Completed exchanges", String(trust?.completed_exchange_count ?? 0)],
    ["Trust signals", String(trust?.verified_signal_count ?? 0)],
  ];

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl bg-emerald-700 text-white"
            >
              S
            </span>
            Swapp
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/homes"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              <House size={17} />
              My homes
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              <MessageCircle size={17} />
              Messages
            </Link>
            <form action={signOut}>
              <button className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-emerald-700">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {params.message ? (
          <div
            role="status"
            className="mb-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            {params.message}
          </div>
        ) : null}

        <p className="text-sm font-semibold text-emerald-700">Member home</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Welcome, {displayName}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-600">
          Your account is secure and ready. Home listings, exchange history, and
          travel planning will appear here as they are added.
        </p>

        <section
          aria-labelledby="trust-heading"
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <h2 id="trust-heading" className="sr-only">
            Trust summary
          </h2>
          {metrics.map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-stone-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
                {value}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
