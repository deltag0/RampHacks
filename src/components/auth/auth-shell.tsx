import Link from "next/link";

type AuthShellProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-stone-50 lg:grid-cols-[1fr_1.08fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-3 text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-lg font-bold text-white"
            >
              S
            </span>
            <span className="text-xl font-semibold tracking-tight">Swapp</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 leading-7 text-stone-600">{description}</p>
          </div>

          {children}
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div
          aria-hidden="true"
          className="absolute -top-28 -right-20 size-96 rounded-full border border-emerald-400/20"
        />
        <div
          aria-hidden="true"
          className="absolute top-12 right-12 size-64 rounded-full bg-emerald-600/15 blur-3xl"
        />
        <div className="relative max-w-lg">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-300 uppercase">
            Travel through trust
          </p>
          <p className="mt-5 text-4xl leading-tight font-medium tracking-tight">
            Exchange homes, discover places, and feel at home anywhere.
          </p>
          <div className="mt-10 flex gap-8 text-sm text-emerald-100">
            <span>Reciprocal matches</span>
            <span>Private by design</span>
            <span>Member trust</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
