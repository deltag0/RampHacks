import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f4ee] text-stone-950">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-white"
          >
            S
          </span>
          <span className="text-xl tracking-tight">Swapp</span>
        </Link>
        <div className="flex items-center gap-2">
          {claims ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Member dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-xl px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Join Swapp
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div
          aria-hidden="true"
          className="absolute -top-28 left-1/3 size-96 rounded-full bg-amber-200/40 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            A more human way to travel
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Your home opens the door to somewhere new.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-stone-600 sm:text-xl">
            Meet trusted members who want to exchange homes, align travel plans,
            and experience a place as someone who lives there.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={claims ? "/dashboard" : "/auth/sign-up"}
              className="rounded-xl bg-emerald-700 px-6 py-3.5 text-center font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {claims ? "Open your dashboard" : "Create your free account"}
            </Link>
            {!claims ? (
              <Link
                href="/auth/login"
                className="rounded-xl border border-stone-300 bg-white/70 px-6 py-3.5 text-center font-semibold text-stone-800 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                I&apos;m already a member
              </Link>
            ) : null}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-5 rotate-3 rounded-[2rem] bg-emerald-200/60" />
          <div className="relative rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-stone-400 uppercase">
                  Reciprocal match
                </p>
                <p className="mt-1 text-xl font-semibold">Lisbon ↔ Montréal</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                12 days
              </span>
            </div>
            <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="aspect-square rounded-2xl bg-[linear-gradient(145deg,#f5c47a,#c66b3d)] p-4 text-white">
                <span className="text-3xl" aria-hidden="true">
                  ☀
                </span>
                <p className="pt-16 text-sm font-semibold">Portugal</p>
              </div>
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-emerald-700 shadow-sm"
              >
                ⇄
              </span>
              <div className="aspect-square rounded-2xl bg-[linear-gradient(145deg,#7196a6,#254e59)] p-4 text-white">
                <span className="text-3xl" aria-hidden="true">
                  ❋
                </span>
                <p className="pt-16 text-sm font-semibold">Québec</p>
              </div>
            </div>
            <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm leading-6 text-stone-600">
              Your destinations and dates align, and both homes fit each
              household&apos;s group size.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
