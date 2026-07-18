import { signInWithGoogle } from "@/app/auth/actions";
import { SubmitButton } from "./submit-button";

export function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <SubmitButton pendingLabel="Opening Google…" variant="secondary">
        <span className="mr-3 grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-blue-600">
          G
        </span>
        Continue with Google
      </SubmitButton>
    </form>
  );
}
