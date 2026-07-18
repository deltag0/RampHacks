import type { Home } from "@/server/data/homes";
import type { HomeSearchFilters } from "./search-filters";

export function filterHomes(homes: Home[], filters: HomeSearchFilters): Home[] {
  const destination = filters.destination.toLocaleLowerCase();

  return homes.filter((home) => {
    const searchText =
      `${home.title} ${home.location} ${home.country}`.toLocaleLowerCase();

    return (
      (!destination || searchText.includes(destination)) &&
      (!filters.travelers || home.guests >= filters.travelers) &&
      (!filters.type || home.type === filters.type) &&
      filters.amenities.every((amenity) => home.amenities.includes(amenity)) &&
      matchesRequestedDates(home, filters.from, filters.to)
    );
  });
}

function matchesRequestedDates(
  home: Home,
  requestedStart: string,
  requestedEnd: string,
): boolean {
  if (!requestedStart && !requestedEnd) return true;

  return home.availability.some(
    (window) =>
      (!requestedStart ||
        (window.startsOn <= requestedStart &&
          window.endsOn >= requestedStart)) &&
      (!requestedEnd ||
        (window.startsOn <= requestedEnd && window.endsOn >= requestedEnd)),
  );
}
