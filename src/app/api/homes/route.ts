import { NextRequest, NextResponse } from "next/server";
import { parseHomeSearchFilters } from "@/domain/homes/search-filters";
import { filterHomes } from "@/domain/homes/filter-homes";
import { getPublishedHomes } from "@/server/data/homes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const filters = parseHomeSearchFilters(request.nextUrl.searchParams);
  const homes = await getPublishedHomes();
  const results = filterHomes(homes, filters);

  return NextResponse.json({
    data: results,
    meta: { total: results.length, filters },
  });
}
