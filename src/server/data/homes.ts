import "server-only";
import { z } from "zod";

export type Home = {
  id: string;
  title: string;
  location: string;
  country: string;
  type: string;
  guests: number;
  amenities: string[];
  accessibility: string[];
  rules: string[];
  photos: {
    id: string;
    url: string;
    alt: string;
  }[];
  availability: {
    startsOn: string;
    endsOn: string;
    minimumNights: number;
  }[];
};

const supabaseHomeSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  approximate_location: z.string(),
  capacity: z.number().int().positive(),
  property_type: z.string(),
  amenities: z.array(z.string()),
  accessibility_features: z.array(z.string()),
  house_rules: z.array(z.string()),
  home_availability: z.array(
    z.object({
      starts_on: z.iso.date(),
      ends_on: z.iso.date(),
      minimum_nights: z.number().int().positive(),
    }),
  ),
  home_photos: z.array(
    z.object({
      id: z.string().uuid(),
      alt_text: z.string(),
      sort_order: z.number().int().nonnegative(),
    }),
  ),
  regions: z
    .object({
      name: z.string(),
      country_code: z.string().length(2),
    })
    .nullable(),
});

const supabaseHomesSchema = z.array(supabaseHomeSchema);

const HOME_SELECT = [
  "id",
  "title",
  "approximate_location",
  "capacity",
  "property_type",
  "amenities",
  "accessibility_features",
  "house_rules",
  "home_photos(id,alt_text,sort_order)",
  "home_availability(starts_on,ends_on,minimum_nights)",
  "regions(name,country_code)",
].join(",");

export async function getPublishedHomes(): Promise<Home[]> {
  return fetchHomes(
    `homes?select=${encodeURIComponent(HOME_SELECT)}&publication_state=eq.published&order=created_at.desc`,
  );
}

export async function getPublishedHomeById(
  id: string,
): Promise<Home | undefined> {
  if (!z.string().uuid().safeParse(id).success) return undefined;

  const homes = await fetchHomes(
    `homes?select=${encodeURIComponent(HOME_SELECT)}&publication_state=eq.published&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return homes[0];
}

async function fetchHomes(path: string): Promise<Home[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Supabase homes request failed with ${response.status}`);
  }

  const parsed = supabaseHomesSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Supabase returned an invalid public homes payload");
  }

  return parsed.data.map((home) => ({
    id: home.id,
    title: home.title,
    location: home.approximate_location,
    country: countryName(home.regions?.country_code),
    type: home.property_type,
    guests: home.capacity,
    amenities: home.amenities,
    accessibility: home.accessibility_features,
    rules: home.house_rules,
    photos: [...home.home_photos]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((photo) => ({
        id: photo.id,
        url: `/api/home-images/${photo.id}`,
        alt: photo.alt_text,
      })),
    availability: home.home_availability.map((window) => ({
      startsOn: window.starts_on,
      endsOn: window.ends_on,
      minimumNights: window.minimum_nights,
    })),
  }));
}

function countryName(countryCode?: string): string {
  if (!countryCode) return "Region unavailable";
  return (
    new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ??
    countryCode
  );
}
