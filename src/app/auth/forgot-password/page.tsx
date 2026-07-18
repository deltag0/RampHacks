import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton } from "@/components/auth/submit-button";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we’ll send a secure link if it matches an account."
    >
      <AuthAlert error={params.error} message={params.message} />
      <form action={requestPasswordReset} className="space-y-5">
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
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-950 shadow-sm transition outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
            placeholder="you@example.com"
          />
        </label>
        <SubmitButton pendingLabel="Sending reset link…">
          Send reset link
        </SubmitButton>
      </form>
      <Link
        href="/auth/login"
        className="mt-8 block text-center text-sm font-semibold text-emerald-700 hover:underline"
      >
        Return to sign in
      </Link>
    </AuthShell>
  );
}
