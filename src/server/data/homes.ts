export type Home = {
  id: string;
  title: string;
  location: string;
  country: string;
  type: string;
  beds: number;
  guests: number;
  rating: string;
  image: string;
  badge?: string;
  amenities: string[];
  member: { name: string; initials: string; exchanges: number };
};

// Real homes will be supplied by the persistence layer once home creation is
// implemented. Keeping this empty avoids presenting synthetic members or homes.
export const homes: Home[] = [];
