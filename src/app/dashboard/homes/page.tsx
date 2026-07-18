import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Eye, HousePlus, Map, Pencil } from "lucide-react";
import { setHomePublication } from "./actions";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ message?: string }> };

export default async function MyHomesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const memberId = auth?.claims?.sub;
  if (!memberId) redirect("/auth/login?next=/dashboard/homes");
  const [{ data: homes }, params] = await Promise.all([
    supabase
      .from("homes")
      .select(
        "id, title, approximate_location, publication_state, home_photos(count)",
      )
      .eq("owner_member_id", memberId)
      .order("created_at", { ascending: false }),
    searchParams,
  ]);
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-stone-500"
            >
              Dashboard
            </Link>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              My homes
            </h1>
          </div>
          <Link
            href="/homes/new"
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
          >
            <HousePlus size={18} /> Add a home
          </Link>
        </div>
        {params.message ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {params.message}
          </div>
        ) : null}
        {homes?.length ? (
          <div className="mt-8 grid gap-5">
            {homes.map((home) => {
              const photoCount = Array.isArray(home.home_photos)
                ? (home.home_photos[0]?.count ?? 0)
                : 0;
              return (
                <article
                  key={home.id}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 capitalize">
                        {home.publication_state}
                      </span>
                      <h2 className="mt-3 text-xl font-semibold">
                        {home.title}
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        {home.approximate_location} · {photoCount}{" "}
                        {photoCount === 1 ? "photo" : "photos"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/homes/${home.id}/edit`}
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold"
                      >
                        <Pencil size={16} /> Edit
                      </Link>
                      <Link
                        href={`/homes/${home.id}/tour`}
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold"
                      >
                        <Map size={16} /> Tour
                      </Link>
                      {home.publication_state === "published" ? (
                        <form action={setHomePublication}>
                          <input type="hidden" name="homeId" value={home.id} />
                          <input type="hidden" name="state" value="paused" />
                          <button className="flex items-center gap-2 rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white">
                            <Eye size={16} /> Pause
                          </button>
                        </form>
                      ) : (
                        <form action={setHomePublication}>
                          <input type="hidden" name="homeId" value={home.id} />
                          <input type="hidden" name="state" value="published" />
                          <button
                            disabled={photoCount === 0}
                            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                          >
                            <Camera size={16} /> Publish
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <HousePlus className="mx-auto text-stone-400" size={34} />
            <h2 className="mt-4 text-xl font-semibold">Add your first home</h2>
            <p className="mt-2 text-sm text-stone-500">
              Listings begin as private drafts.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
