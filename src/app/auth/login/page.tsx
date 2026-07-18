import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { safeNextPath } from "@/domain/auth/validation";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your exchanges and continue planning your next trip."
    >
      <AuthAlert error={params.error} message={params.message} />
      <GoogleButton />

      <div className="my-6 flex items-center gap-4 text-xs font-medium tracking-wider text-stone-400 uppercase">
        <span className="h-px flex-1 bg-stone-200" />
        or use email
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <form action={signIn} className="space-y-5">
        <input type="hidden" name="next" value={safeNextPath(params.next)} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            Email address
          </span>
          <input
            required
            autoComplete="email"
            inputMode="email"
            name="email"
            type="email"
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center justify-between gap-4 text-sm font-medium text-stone-800">
            Password
            <Link
              href="/auth/forgot-password"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Forgot password?
            </Link>
          </span>
          <input
            required
            autoComplete="current-password"
            name="password"
            type="password"
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
          />
        </label>

        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-stone-600">
        New to Swapp?{" "}
        <Link
          href="/auth/sign-up"
          className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
