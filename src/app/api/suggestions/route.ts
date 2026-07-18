import { NextResponse } from "next/server";
import {
  buildVerifiedSuggestionFacts,
  homeSuggestionRequestSchema,
} from "@/domain/suggestions/home-suggestion";
import { createClient } from "@/lib/supabase/server";
import { generateHomeSuggestion } from "@/server/ai/home-suggestion";
import { takeSuggestionRateLimit } from "@/server/ai/suggestion-rate-limit";
import { getPublishedHomeById } from "@/server/data/homes";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    return NextResponse.json(
      { error: "Sign in to view personalized suggestions." },
      { status: 401 },
    );
  }

  const rateLimit = takeSuggestionRateLimit(data.claims.sub);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many suggestion requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = homeSuggestionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid suggestion request." },
      { status: 400 },
    );
  }

  const home = await getPublishedHomeById(parsed.data.homeId);
  if (!home) {
    return NextResponse.json(
      { error: "That published home is unavailable." },
      { status: 404 },
    );
  }

  const facts = buildVerifiedSuggestionFacts(home, parsed.data.search);
  const suggestion = await generateHomeSuggestion(facts);

  return NextResponse.json({ suggestion });
}
