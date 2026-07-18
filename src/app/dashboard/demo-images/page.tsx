import { redirect } from "next/navigation";
import { DemoImageImporter } from "@/components/homes/demo-image-importer";
import { createClient } from "@/lib/supabase/server";

export default async function DemoImagesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const memberId = auth?.claims?.sub;
  if (!memberId) redirect("/auth/login?next=/dashboard/demo-images");
  const { data: member } = await supabase
    .from("members")
    .select("display_name, lifecycle_state")
    .eq("id", memberId)
    .maybeSingle();
  if (
    member?.lifecycle_state !== "active" ||
    member.display_name.toLowerCase() !== "kelvin"
  ) {
    redirect("/dashboard");
  }
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
        <p className="text-sm font-semibold text-emerald-700">Demo setup</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Add generated listing images
        </h1>
        <p className="mt-3 mb-8 text-stone-600">
          This protected utility uses normal owner RLS and can only run as the
          active Kelvin member.
        </p>
        <DemoImageImporter memberId={memberId} />
      </div>
    </main>
  );
}
