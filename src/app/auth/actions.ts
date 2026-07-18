"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  emailSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/domain/auth/validation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function firstValidationError(error: {
  issues: ReadonlyArray<{ message: string }>;
}) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

function authRedirect(
  path: string,
  kind: "error" | "message",
  message: string,
): never {
  const params = new URLSearchParams({ [kind]: message });
  redirect(`${path}?${params.toString()}`);
}

async function getOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });

  if (!parsed.success) {
    authRedirect("/auth/login", "error", firstValidationError(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    authRedirect(
      "/auth/login",
      "error",
      "Email or password was not recognized.",
    );
  }

  redirect(safeNextPath(field(formData, "next")));
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    displayName: field(formData, "displayName"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    authRedirect("/auth/sign-up", "error", firstValidationError(parsed.error));
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    authRedirect(
      "/auth/sign-up",
      "error",
      error.code === "user_already_exists"
        ? "An account with this email already exists."
        : "We could not create the account. Please try again.",
    );
  }

  if (data.session) {
    redirect("/dashboard?message=Welcome+to+Swapp.");
  }

  authRedirect(
    "/auth/login",
    "message",
    "Check your email to confirm your account, then sign in.",
  );
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    authRedirect(
      "/auth/login",
      "error",
      "Google sign-in is unavailable. Check the provider configuration.",
    );
  }

  redirect(data.url);
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse({ email: field(formData, "email") });

  if (!parsed.success) {
    authRedirect(
      "/auth/forgot-password",
      "error",
      firstValidationError(parsed.error),
    );
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });

  authRedirect(
    "/auth/forgot-password",
    "message",
    "If an account exists for that email, a reset link is on its way.",
  );
}

export async function updatePassword(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse({
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    authRedirect(
      "/auth/update-password",
      "error",
      firstValidationError(parsed.error),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    authRedirect(
      "/auth/update-password",
      "error",
      "Your password could not be updated. Request a new reset link.",
    );
  }

  authRedirect("/dashboard", "message", "Your password has been updated.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
