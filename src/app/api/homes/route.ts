import { NextRequest, NextResponse } from "next/server";
import { homes } from "@/server/data/homes";

export function GET(request: NextRequest) {
  const destination = request.nextUrl.searchParams.get("destination")?.toLowerCase();
  const guests = Number(request.nextUrl.searchParams.get("guests") ?? 0);
  const results = homes.filter((home) => {
    const locationMatches =
      !destination ||
      `${home.location} ${home.country}`.toLowerCase().includes(destination);
    return locationMatches && (!guests || home.guests >= guests);
  });

  return NextResponse.json({ data: results, meta: { total: results.length } });
}
