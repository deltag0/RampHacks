"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, LoaderCircle } from "lucide-react";
import {
  commonAmenities,
  homeListingSchema,
  propertyTypes,
  validateHomeImages,
} from "@/domain/homes/listing-validation";
import { createClient } from "@/lib/supabase/client";

type Region = { id: string; name: string; country_code: string };
type EditableHome = {
  id: string;
  title: string;
  region_id: string;
  approximate_location: string;
  capacity: number;
  property_type: string;
  amenities: string[];
  accessibility_features: string[];
  house_rules: string[];
};

export function HomeListingForm({
  memberId,
  regions,
  home,
}: {
  memberId: string;
  regions: Region[];
  home?: EditableHome;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    home?.amenities ?? [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const files = form
      .getAll("photos")
      .filter((item): item is File => item instanceof File && item.size > 0);
    const imageError = validateHomeImages(files);
    if (imageError) return setError(imageError);
    if (!home && files.length === 0)
      return setError("Add at least one clear home photo.");

    const parsed = homeListingSchema.safeParse({
      title: form.get("title"),
      regionId: form.get("regionId"),
      approximateLocation: form.get("approximateLocation"),
      capacity: Number(form.get("capacity")),
      propertyType: form.get("propertyType"),
      amenities: selectedAmenities,
      accessibility: splitLines(String(form.get("accessibility") ?? "")),
      rules: splitLines(String(form.get("rules") ?? "")),
    });
    if (!parsed.success)
      return setError("Review the highlighted home details and try again.");

    setSaving(true);
    const supabase = createClient();
    const payload = {
      owner_member_id: memberId,
      region_id: parsed.data.regionId,
      title: parsed.data.title,
      approximate_location: parsed.data.approximateLocation,
      capacity: parsed.data.capacity,
      property_type: parsed.data.propertyType,
      amenities: parsed.data.amenities,
      accessibility_features: parsed.data.accessibility,
      house_rules: parsed.data.rules,
    };

    const result = home
      ? await supabase
          .from("homes")
          .update(payload)
          .eq("id", home.id)
          .select("id")
          .single()
      : await supabase
          .from("homes")
          .insert({ ...payload, publication_state: "draft" })
          .select("id")
          .single();
    if (result.error || !result.data) {
      setSaving(false);
      return setError("The home could not be saved. Please try again.");
    }

    const homeId = result.data.id;
    const { count } = await supabase
      .from("home_photos")
      .select("id", { count: "exact", head: true })
      .eq("home_id", homeId);

    for (const [offset, file] of files.entries()) {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || mimeExtension(file.type);
      const path = `${memberId}/${homeId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("home-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (uploadError) {
        setSaving(false);
        return setError(
          "Your draft was saved, but a photo failed to upload. You can retry from Edit home.",
        );
      }
      const { error: photoError } = await supabase.from("home_photos").insert({
        home_id: homeId,
        storage_path: path,
        alt_text: `${parsed.data.title}, photo ${(count ?? 0) + offset + 1}`,
        sort_order: (count ?? 0) + offset,
      });
      if (photoError) {
        await supabase.storage.from("home-images").remove([path]);
        setSaving(false);
        return setError(
          "Your draft was saved, but a photo could not be attached. Please retry.",
        );
      }
    }

    router.push(
      `/dashboard/homes?message=${encodeURIComponent(home ? "Home updated." : "Draft home created.")}`,
    );
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">The essentials</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Listing title">
            <input
              name="title"
              required
              minLength={3}
              maxLength={120}
              defaultValue={home?.title}
              placeholder="A bright apartment near the old town"
            />
          </Field>
          <Field label="Region">
            <select
              name="regionId"
              required
              defaultValue={home?.region_id ?? ""}
            >
              <option value="" disabled>
                Select a region
              </option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name} · {region.country_code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Approximate public location">
            <input
              name="approximateLocation"
              required
              maxLength={160}
              defaultValue={home?.approximate_location}
              placeholder="Central Lisbon"
            />
          </Field>
          <Field label="Home type">
            <select
              name="propertyType"
              defaultValue={home?.property_type ?? propertyTypes[0]}
            >
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Sleeps">
            <input
              name="capacity"
              required
              type="number"
              min={1}
              max={50}
              defaultValue={home?.capacity ?? 2}
            />
          </Field>
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Amenities</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {commonAmenities.map((amenity) => (
            <label
              key={amenity}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${selectedAmenities.includes(amenity) ? "border-emerald-700 bg-emerald-50" : "border-stone-200"}`}
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() =>
                  setSelectedAmenities((current) =>
                    current.includes(amenity)
                      ? current.filter((item) => item !== amenity)
                      : [...current, amenity],
                  )
                }
                className="accent-emerald-700"
              />
              {amenity}
            </label>
          ))}
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Accessibility features" hint="One per line">
            <textarea
              name="accessibility"
              rows={4}
              defaultValue={home?.accessibility_features.join("\n")}
            />
          </Field>
          <Field label="House rules" hint="One per line">
            <textarea
              name="rules"
              rows={4}
              defaultValue={home?.house_rules.join("\n")}
            />
          </Field>
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Home photos</h2>
        <p className="mt-2 text-sm text-stone-500">
          JPEG, PNG, WebP, or AVIF. Up to 12 files and 10 MB each. Remove
          visible keys, documents, addresses, and location metadata first.
        </p>
        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-5 py-10 font-semibold text-stone-600 hover:border-emerald-600 hover:text-emerald-700">
          <ImagePlus size={22} />{" "}
          {home ? "Add more photos" : "Choose home photos"}
          <input
            className="sr-only"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
          />
        </label>
      </section>
      <button
        disabled={saving || regions.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {saving ? (
          <LoaderCircle className="animate-spin" size={19} />
        ) : (
          <Check size={19} />
        )}
        {saving
          ? "Saving securely…"
          : home
            ? "Save changes"
            : "Create draft home"}
      </button>
      {regions.length === 0 ? (
        <p className="text-center text-sm text-amber-700">
          No regions are configured yet. Add normalized regions before creating
          a home.
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-stone-700">
      {label}
      {hint ? (
        <small className="ml-2 font-normal text-stone-400">{hint}</small>
      ) : null}
      <span className="mt-2 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone-300 [&_input]:px-4 [&_input]:py-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-stone-300 [&_select]:px-4 [&_select]:py-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-stone-300 [&_textarea]:px-4 [&_textarea]:py-3">
        {children}
      </span>
    </label>
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mimeExtension(type: string) {
  return type === "image/jpeg" ? "jpg" : type.split("/")[1] || "img";
}
