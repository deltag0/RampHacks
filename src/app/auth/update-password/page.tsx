import { redirect } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { createClient } from "@/lib/supabase/server";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect("/auth/forgot-password");
  }

  const params = await searchParams;

  return (
    <AuthShell
      title="Choose a new password"
      description="Use a password you do not reuse on another account."
    >
      <AuthAlert error={params.error} message={params.message} />
      <form action={updatePassword} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            New password
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
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-800">
            Confirm new password
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
        <SubmitButton pendingLabel="Updating password…">
          Update password
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
