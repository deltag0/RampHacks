"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary";
};

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const colors =
    variant === "primary"
      ? "bg-emerald-700 text-white hover:bg-emerald-800"
      : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60 ${colors}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
