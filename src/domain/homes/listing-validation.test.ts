import { describe, expect, it } from "vitest";
import { homeListingSchema, validateHomeImages } from "./listing-validation";

const validListing = {
  title: "A bright city apartment",
  regionId: "a90bca26-0adf-4ff7-a928-70d784e0f470",
  approximateLocation: "Central Lisbon",
  capacity: 4,
  propertyType: "Apartment",
  amenities: ["Workspace"],
  accessibility: [],
  rules: ["No smoking"],
};

describe("home listing validation", () => {
  it("accepts a complete listing", () => {
    expect(homeListingSchema.safeParse(validListing).success).toBe(true);
  });

  it("rejects invalid capacity and region identifiers", () => {
    expect(
      homeListingSchema.safeParse({
        ...validListing,
        regionId: "Lisbon",
        capacity: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported image formats", () => {
    const file = new File(["image"], "room.gif", { type: "image/gif" });
    expect(validateHomeImages([file])).toContain("not a supported image");
  });
});
