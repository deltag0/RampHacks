import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HomeListingForm } from "@/components/homes/home-listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const memberId = auth?.claims?.sub;
  if (!memberId) redirect(`/auth/login?next=/homes/${id}/edit`);
  const [{ data: home }, { data: regions }] = await Promise.all([
    supabase
      .from("homes")
      .select(
        "id, title, region_id, approximate_location, capacity, property_type, amenities, accessibility_features, house_rules",
      )
      .eq("id", id)
      .eq("owner_member_id", memberId)
      .maybeSingle(),
    supabase.from("regions").select("id, name, country_code").order("name"),
  ]);
  if (!home) notFound();
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link
          href="/dashboard/homes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft size={17} /> My homes
        </Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          Edit your home
        </h1>
        <div className="mt-9">
          <HomeListingForm
            memberId={memberId}
            regions={regions ?? []}
            home={home}
          />
        </div>
      </div>
    </main>
  );
}
