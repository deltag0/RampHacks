import { describe, expect, it } from "vitest";
import { filterHomes } from "./filter-homes";
import {
  DEFAULT_HOME_SEARCH_FILTERS,
  type HomeSearchFilters,
} from "./search-filters";
import type { Home } from "@/server/data/homes";

const homes: Home[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    title: "Lisbon flat",
    location: "Central Lisbon",
    country: "Portugal",
    type: "Apartment",
    guests: 2,
    amenities: ["Workspace", "Washer"],
    accessibility: [],
    rules: [],
    photos: [],
    availability: [
      { startsOn: "2026-09-05", endsOn: "2026-09-26", minimumNights: 5 },
    ],
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    title: "Ocean villa",
    location: "Atlantic Seaboard area",
    country: "South Africa",
    type: "Villa",
    guests: 8,
    amenities: ["Pool", "Workspace"],
    accessibility: ["Step-free main floor"],
    rules: [],
    photos: [],
    availability: [
      { startsOn: "2027-02-01", endsOn: "2027-03-15", minimumNights: 10 },
    ],
  },
];

function withFilters(patch: Partial<HomeSearchFilters>): HomeSearchFilters {
  return { ...DEFAULT_HOME_SEARCH_FILTERS, ...patch };
}

describe("filterHomes", () => {
  it("combines destination, capacity, type, and amenity filters", () => {
    expect(
      filterHomes(
        homes,
        withFilters({
          destination: "south africa",
          travelers: 6,
          type: "Villa",
          amenities: ["Pool", "Workspace"],
        }),
      ).map((home) => home.id),
    ).toEqual(["20000000-0000-4000-8000-000000000004"]);
  });

  it("requires the requested stay to fit inside one availability window", () => {
    expect(
      filterHomes(
        homes,
        withFilters({ from: "2026-09-05", to: "2026-09-26" }),
      ).map((home) => home.id),
    ).toEqual(["20000000-0000-4000-8000-000000000001"]);

    expect(
      filterHomes(homes, withFilters({ from: "2026-09-01", to: "2026-09-10" })),
    ).toEqual([]);
  });

  it("supports open-ended date filtering", () => {
    expect(
      filterHomes(homes, withFilters({ from: "2027-03-01" })).map(
        (home) => home.id,
      ),
    ).toEqual(["20000000-0000-4000-8000-000000000004"]);
  });
});
