import { NextRequest, NextResponse } from "next/server";
import { parseHomeSearchFilters } from "@/domain/homes/search-filters";
import { homes } from "@/server/data/homes";

export function GET(request: NextRequest) {
  const filters = parseHomeSearchFilters(request.nextUrl.searchParams);
  const results = homes.filter((home) => {
    const searchText =
      `${home.title} ${home.location} ${home.country}`.toLowerCase();
    return (
      (!filters.destination ||
        searchText.includes(filters.destination.toLowerCase())) &&
      (!filters.travelers || home.guests >= filters.travelers) &&
      (!filters.type || home.type === filters.type) &&
      filters.amenities.every((amenity) =>
        home.amenities.includes(amenity),
      )
    );
  });

  results.sort((a, b) => {
    if (filters.sort === "rating") {
      return Number(b.rating) - Number(a.rating);
    }
    if (filters.sort === "exchanges") {
      return b.member.exchanges - a.member.exchanges;
    }
    return 0;
  });

  return NextResponse.json({
    data: results,
    meta: { total: results.length, filters },
  });
}
