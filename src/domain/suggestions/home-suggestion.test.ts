import { describe, expect, it } from "vitest";
import {
  buildDeterministicSuggestion,
  buildVerifiedSuggestionFacts,
} from "./home-suggestion";

const home = {
  id: "95ab2338-2e10-4450-899f-6c786f13b55f",
  title: "Canal-side family home",
  location: "Copenhagen",
  country: "Denmark",
  type: "House",
  guests: 5,
  amenities: ["Workspace", "Garden"],
  accessibility: [],
  rules: [],
};

describe("home suggestion facts", () => {
  it("keeps only search claims verified against the published home", () => {
    expect(
      buildVerifiedSuggestionFacts(home, {
        destination: "Copenhagen",
        travelers: 4,
        amenities: ["Workspace", "Pool"],
      }),
    ).toMatchObject({
      matchedDestination: "Copenhagen",
      matchedTravelerCount: 4,
      matchedAmenities: ["Workspace"],
    });
  });

  it("provides a truthful fallback without an AI service", () => {
    const suggestion = buildDeterministicSuggestion(
      buildVerifiedSuggestionFacts(home, {
        destination: "Berlin",
        travelers: 8,
        amenities: ["Pool"],
      }),
    );

    expect(suggestion.generatedBy).toBe("deterministic");
    expect(suggestion.fitLabel).toBe("Listing highlight");
    expect(suggestion.reasons[0]).toContain("sleeps 5");
  });
});
