import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { SubmitButton } from "@/components/auth/submit-button";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Join Swapp"
      description="Create your member profile and start building trusted home exchanges."
    >
      <AuthAlert error={params.error} message={params.message} />
      <GoogleButton />

      <div className="my-6 flex items-center gap-4 text-xs font-medium tracking-wider text-stone-400 uppercase">
        <span className="h-px flex-1 bg-stone-200" />
        or use email
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <form action={signUp} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            Display name
          </span>
          <input
            required
            autoComplete="name"
            maxLength={80}
            name="displayName"
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
            placeholder="How members will know you"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            Email address
          </span>
          <input
            required
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            name="email"
            type="email"
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            Password
          </span>
          <input
            required
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            name="password"
            type="password"
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
          />
          <span className="mt-2 block text-xs text-stone-500">
            Use at least 8 characters.
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            Confirm password
          </span>
          <input
            required
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            name="confirmPassword"
            type="password"
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
          />
        </label>

        <div className="pt-2">
          <SubmitButton pendingLabel="Creating account…">
            Create account
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-stone-500">
        By creating an account, you agree to follow Swapp&apos;s community and
        safety standards.
      </p>
      <p className="mt-5 text-center text-sm text-stone-600">
        Already a member?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
