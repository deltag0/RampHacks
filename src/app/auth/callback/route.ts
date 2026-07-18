import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/domain/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProtocol =
        request.headers.get("x-forwarded-proto") ?? "https";

      if (forwardedHost && process.env.NODE_ENV !== "development") {
        return NextResponse.redirect(
          `${forwardedProtocol}://${forwardedHost}${next}`,
        );
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const errorUrl = new URL("/auth/login", request.url);
  errorUrl.searchParams.set(
    "error",
    "The sign-in link is invalid or has expired. Please try again.",
  );
  return NextResponse.redirect(errorUrl);
}
