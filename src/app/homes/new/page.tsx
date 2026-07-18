import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HomeListingForm } from "@/components/homes/home-listing-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "List your home" };

export default async function NewHomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const memberId = data?.claims?.sub;
  if (!memberId) redirect("/auth/login?next=/homes/new");
  const { data: regions } = await supabase
    .from("regions")
    .select("id, name, country_code")
    .order("name");
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link
          href="/dashboard/homes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft size={17} /> My homes
        </Link>
        <p className="mt-8 text-sm font-semibold text-emerald-700">
          New listing
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Share your home
        </h1>
        <p className="mt-3 text-stone-600">
          Start privately as a draft. You decide when it is ready to publish.
        </p>
        <div className="mt-9">
          <HomeListingForm memberId={memberId} regions={regions ?? []} />
        </div>
      </div>
    </main>
  );
}
