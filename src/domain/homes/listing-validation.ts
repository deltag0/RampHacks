import { z } from "zod";

export const propertyTypes = [
  "Apartment",
  "House",
  "Townhouse",
  "Cottage",
  "Villa",
  "Loft",
] as const;

export const commonAmenities = [
  "Workspace",
  "Washer",
  "Parking",
  "Garden",
  "Pool",
  "Bikes",
  "Air conditioning",
  "Fireplace",
] as const;

export const homeListingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  regionId: z.string().uuid(),
  approximateLocation: z.string().trim().min(2).max(160),
  capacity: z.number().int().min(1).max(50),
  propertyType: z.enum(propertyTypes),
  amenities: z.array(z.string().trim().min(1).max(80)).max(30),
  accessibility: z.array(z.string().trim().min(1).max(120)).max(30),
  rules: z.array(z.string().trim().min(1).max(120)).max(30),
});

export const homeImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_HOME_IMAGES = 12;
export const MAX_HOME_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateHomeImages(files: File[]) {
  if (files.length > MAX_HOME_IMAGES) {
    return `Choose no more than ${MAX_HOME_IMAGES} photos.`;
  }
  for (const file of files) {
    if (
      !homeImageTypes.includes(file.type as (typeof homeImageTypes)[number])
    ) {
      return `${file.name} is not a supported image.`;
    }
    if (file.size > MAX_HOME_IMAGE_BYTES) {
      return `${file.name} is larger than 10 MB.`;
    }
  }
  return null;
}
