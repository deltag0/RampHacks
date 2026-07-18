import { NextResponse } from "next/server";
import { z } from "zod";

const photoSchema = z.array(
  z.object({
    storage_path: z.string().min(1),
  }),
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params;
  if (!z.string().uuid().safeParse(photoId).success) {
    return new NextResponse("Not found", { status: 404 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new NextResponse("Unavailable", { status: 503 });

  const metadata = await fetch(
    `${url}/rest/v1/home_photos?select=storage_path&id=eq.${encodeURIComponent(photoId)}&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    },
  );
  if (!metadata.ok) return new NextResponse("Not found", { status: 404 });
  const parsed = photoSchema.safeParse(await metadata.json());
  const storagePath = parsed.success ? parsed.data[0]?.storage_path : undefined;
  if (!storagePath) return new NextResponse("Not found", { status: 404 });

  const image = await fetch(
    `${url}/storage/v1/object/authenticated/home-images/${storagePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!image.ok || !image.body) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
