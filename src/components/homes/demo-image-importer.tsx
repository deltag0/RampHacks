"use client";

import { useState } from "react";
import { Check, LoaderCircle, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const demoImages = [
  {
    homeId: "20000000-0000-4000-8000-000000000001",
    asset: "/demo-homes/lisbon.png",
    alt: "Sunlit Lisbon apartment living room with tiled walls and tall windows",
  },
  {
    homeId: "20000000-0000-4000-8000-000000000002",
    asset: "/demo-homes/kyoto.png",
    alt: "Machiya-inspired Kyoto sitting room opening to a moss garden",
  },
  {
    homeId: "20000000-0000-4000-8000-000000000003",
    asset: "/demo-homes/quebec-city.png",
    alt: "Warm Québec City stone cottage living room with a fireplace",
  },
  {
    homeId: "20000000-0000-4000-8000-000000000004",
    asset: "/demo-homes/cape-town.png",
    alt: "Cape Town hillside villa living room overlooking the ocean",
  },
  {
    homeId: "20000000-0000-4000-8000-000000000005",
    asset: "/demo-homes/copenhagen.png",
    alt: "Bright Copenhagen canal-side loft with Scandinavian furniture",
  },
] as const;

export function DemoImageImporter({ memberId }: { memberId: string }) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [message, setMessage] = useState("");

  async function importImages() {
    setState("working");
    setMessage("");
    const supabase = createClient();
    let imported = 0;
    for (const item of demoImages) {
      const { count } = await supabase
        .from("home_photos")
        .select("id", { count: "exact", head: true })
        .eq("home_id", item.homeId);
      if ((count ?? 0) > 0) continue;

      const response = await fetch(item.asset);
      if (!response.ok) {
        setState("idle");
        return setMessage(`Could not load ${item.asset}.`);
      }
      const blob = await response.blob();
      const storagePath = `${memberId}/${item.homeId}/demo-primary.png`;
      const { error: uploadError } = await supabase.storage
        .from("home-images")
        .upload(storagePath, blob, {
          contentType: "image/png",
          cacheControl: "31536000",
          upsert: true,
        });
      if (uploadError) {
        setState("idle");
        return setMessage(
          "Upload failed. Confirm you are signed in as Kelvin.",
        );
      }
      const { error: recordError } = await supabase.from("home_photos").insert({
        home_id: item.homeId,
        storage_path: storagePath,
        alt_text: item.alt,
        sort_order: 0,
      });
      if (recordError) {
        await supabase.storage.from("home-images").remove([storagePath]);
        setState("idle");
        return setMessage("A photo uploaded but could not be attached.");
      }
      imported += 1;
    }
    setState("done");
    setMessage(`${imported} demo images imported. Refresh the home search.`);
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Import generated demo images</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        Upload five reviewed fictional home images through your authenticated
        Kelvin session. Existing home photos are left unchanged.
      </p>
      <button
        type="button"
        disabled={state !== "idle"}
        onClick={importImages}
        className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {state === "working" ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : state === "done" ? (
          <Check size={18} />
        ) : (
          <UploadCloud size={18} />
        )}
        {state === "working"
          ? "Uploading securely…"
          : state === "done"
            ? "Import complete"
            : "Import five images"}
      </button>
      {message ? (
        <p className="mt-4 text-sm text-stone-600" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
