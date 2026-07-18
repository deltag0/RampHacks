import { NextRequest, NextResponse } from "next/server";
import { parseHomeSearchFilters } from "@/domain/homes/search-filters";
import { getPublishedHomes } from "@/server/data/homes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const filters = parseHomeSearchFilters(request.nextUrl.searchParams);
  const homes = await getPublishedHomes();
  const results = homes.filter((home) => {
    const searchText =
      `${home.title} ${home.location} ${home.country}`.toLowerCase();
    return (
      (!filters.destination ||
        searchText.includes(filters.destination.toLowerCase())) &&
      (!filters.travelers || home.guests >= filters.travelers) &&
      (!filters.type || home.type === filters.type) &&
      filters.amenities.every((amenity) => home.amenities.includes(amenity))
    );
  });

  return NextResponse.json({
    data: results,
    meta: { total: results.length, filters },
  });
}
