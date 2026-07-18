import { z } from "zod";

export const homeSuggestionRequestSchema = z.object({
  homeId: z.string().uuid(),
  search: z.object({
    destination: z.string().trim().max(120).default(""),
    travelers: z.number().int().min(0).max(20).default(0),
    amenities: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  }),
});

export const generatedHomeSuggestionSchema = z.object({
  headline: z.string().trim().min(1).max(90),
  reasons: z.array(z.string().trim().min(1).max(180)).min(1).max(3),
});

export type HomeSuggestionRequest = z.infer<typeof homeSuggestionRequestSchema>;
export type GeneratedHomeSuggestion = z.infer<
  typeof generatedHomeSuggestionSchema
>;

export type VerifiedSuggestionFacts = {
  homeId: string;
  homeTitle: string;
  approximateLocation: string;
  country: string;
  propertyType: string;
  capacity: number;
  matchedDestination?: string;
  matchedTravelerCount?: number;
  matchedAmenities: string[];
};

export type HomeSuggestion = GeneratedHomeSuggestion & {
  fitLabel: "Matches your filters" | "Listing highlight";
  generatedBy: "openai" | "deterministic";
};

type SuggestibleHome = {
  id: string;
  title: string;
  location: string;
  country: string;
  type: string;
  guests: number;
  amenities: string[];
};

export function buildVerifiedSuggestionFacts(
  home: SuggestibleHome,
  search: HomeSuggestionRequest["search"],
): VerifiedSuggestionFacts {
  const location = `${home.location} ${home.country}`.toLocaleLowerCase();
  const destination = search.destination.toLocaleLowerCase();
  const matchedDestination =
    destination && location.includes(destination)
      ? search.destination
      : undefined;
  const matchedTravelerCount =
    search.travelers > 0 && home.guests >= search.travelers
      ? search.travelers
      : undefined;
  const matchedAmenities = search.amenities.filter((requested) =>
    home.amenities.some(
      (available) =>
        available.toLocaleLowerCase() === requested.toLocaleLowerCase(),
    ),
  );

  return {
    homeId: home.id,
    homeTitle: home.title,
    approximateLocation: home.location,
    country: home.country,
    propertyType: home.type,
    capacity: home.guests,
    matchedDestination,
    matchedTravelerCount,
    matchedAmenities,
  };
}

export function buildDeterministicSuggestion(
  facts: VerifiedSuggestionFacts,
): HomeSuggestion {
  const reasons: string[] = [];

  if (facts.matchedDestination) {
    reasons.push(
      `Its approximate location aligns with your search for ${facts.matchedDestination}.`,
    );
  }
  if (facts.matchedTravelerCount) {
    reasons.push(
      `It sleeps ${facts.capacity}, enough for your household of ${facts.matchedTravelerCount}.`,
    );
  }
  if (facts.matchedAmenities.length) {
    reasons.push(`It includes ${formatList(facts.matchedAmenities)}.`);
  }
  if (!reasons.length) {
    reasons.push(
      `This published ${facts.propertyType.toLocaleLowerCase()} sleeps ${facts.capacity}.`,
    );
  }

  return {
    headline:
      reasons.length > 1 ? "A good fit for your search" : "Why it stands out",
    reasons: reasons.slice(0, 3),
    fitLabel:
      facts.matchedDestination ||
      facts.matchedTravelerCount ||
      facts.matchedAmenities.length
        ? "Matches your filters"
        : "Listing highlight",
    generatedBy: "deterministic",
  };
}

function formatList(items: string[]): string {
  return new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(items);
}
