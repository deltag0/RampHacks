export const HOME_TYPES = [
  "Apartment",
  "House",
  "Cottage",
  "Villa",
  "Loft",
  "Townhouse",
] as const;

export const HOME_AMENITIES = [
  "Workspace",
  "Pool",
  "Garden",
  "Parking",
  "Washer",
  "Bikes",
] as const;

export type HomeSearchFilters = {
  destination: string;
  from: string;
  to: string;
  travelers: number;
  type: string;
  amenities: string[];
};

export const DEFAULT_HOME_SEARCH_FILTERS: HomeSearchFilters = {
  destination: "",
  from: "",
  to: "",
  travelers: 0,
  type: "",
  amenities: [],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseHomeSearchFilters(
  input: URLSearchParams,
): HomeSearchFilters {
  const rawTravelers = Number.parseInt(input.get("travelers") ?? "", 10);
  const from = normalizeDate(input.get("from"));
  const to = normalizeDate(input.get("to"));

  return {
    destination: (input.get("destination") ?? "").trim().slice(0, 100),
    from,
    to: to && (!from || to >= from) ? to : "",
    travelers:
      Number.isFinite(rawTravelers) && rawTravelers > 0
        ? Math.min(rawTravelers, 20)
        : 0,
    type: HOME_TYPES.includes(input.get("type") as (typeof HOME_TYPES)[number])
      ? (input.get("type") as string)
      : "",
    amenities: [
      ...new Set(
        input
          .getAll("amenity")
          .filter((value) =>
            HOME_AMENITIES.includes(value as (typeof HOME_AMENITIES)[number]),
          ),
      ),
    ],
  };
}

export function serializeHomeSearchFilters(
  filters: HomeSearchFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.destination.trim()) {
    params.set("destination", filters.destination.trim());
  }
  if (filters.from) params.set("from", filters.from);
  if (filters.to && (!filters.from || filters.to >= filters.from)) {
    params.set("to", filters.to);
  }
  if (filters.travelers > 0) {
    params.set("travelers", String(Math.min(filters.travelers, 20)));
  }
  if (filters.type) params.set("type", filters.type);
  filters.amenities.forEach((amenity) => params.append("amenity", amenity));
  return params;
}

function normalizeDate(value: string | null): string {
  if (!value || !ISO_DATE.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
    ? ""
    : value;
}
