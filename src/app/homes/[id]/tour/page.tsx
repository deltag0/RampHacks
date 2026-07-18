import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { HomeTourBuilder } from "@/components/home-tour-builder";
import type { HomeTour } from "@/domain/home-tours/model";
import { createClient } from "@/lib/supabase/server";

export default async function HomeTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const memberId = auth?.claims?.sub;
  if (!memberId) redirect(`/auth/login?next=/homes/${id}/tour`);
  const { data: home } = await supabase
    .from("homes")
    .select("id, title")
    .eq("id", id)
    .eq("owner_member_id", memberId)
    .maybeSingle();
  if (!home) notFound();

  const { data: savedTour } = await supabase
    .from("home_tours")
    .select(
      "id, title, start_scene_id, home_tour_scenes(id, name, image_alt, storage_path, sort_order), home_tour_connections(id, from_scene_id, to_scene_id, label, position_x, position_y)",
    )
    .eq("home_id", id)
    .maybeSingle();

  let initialTour: HomeTour | undefined;
  if (savedTour) {
    const scenes = [...savedTour.home_tour_scenes].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const { data: signed } = await supabase.storage
      .from("home-tour-images")
      .createSignedUrls(
        scenes.map((scene) => scene.storage_path),
        3600,
      );
    initialTour = {
      title: savedTour.title,
      startSceneId: savedTour.start_scene_id,
      scenes: scenes.map((scene, index) => ({
        id: scene.id,
        name: scene.name,
        imageAlt: scene.image_alt,
        storagePath: scene.storage_path,
        imageUrl: signed?.[index]?.signedUrl ?? "",
      })),
      connections: savedTour.home_tour_connections.map((connection) => ({
        id: connection.id,
        fromSceneId: connection.from_scene_id,
        toSceneId: connection.to_scene_id,
        label: connection.label,
        position: {
          x: Number(connection.position_x),
          y: Number(connection.position_y),
        },
      })),
    };
  }

  return (
    <main className="tour-page">
      <Header solid />
      <section className="tour-page-intro container">
        <Link
          href="/dashboard/homes"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft size={17} /> My homes
        </Link>
        <span className="kicker">Interactive home tour</span>
        <h1>Show members around {home.title}.</h1>
        <p>
          Connect private room photos with directional arrows, preview the
          experience, then save it to this home.
        </p>
      </section>
      <section className="tour-builder-section container">
        <HomeTourBuilder
          homeId={id}
          memberId={memberId}
          initialTour={initialTour}
        />
      </section>
    </main>
  );
}
