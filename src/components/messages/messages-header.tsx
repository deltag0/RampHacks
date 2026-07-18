import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export function MessagesHeader({ back = false }: { back?: boolean }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          {back ? (
            <Link
              href="/messages"
              aria-label="Back to conversations"
              className="grid size-9 place-items-center rounded-full text-stone-600 hover:bg-stone-100"
            >
              <ArrowLeft size={20} />
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 font-semibold"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-700 text-white">
              S
            </span>
            Swapp
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950"
        >
          <Home size={17} />
          Dashboard
        </Link>
      </div>
    </header>
  );
}
