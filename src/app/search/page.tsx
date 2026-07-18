import { Suspense } from "react";
import { Header } from "@/components/header";
import { SearchExperience } from "@/components/search-experience";
import { getPublishedHomes } from "@/server/data/homes";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const homes = await getPublishedHomes();
  const urlStateKey = JSON.stringify(await searchParams);

  return (
    <main className="search-page">
      <Header solid />
      <Suspense
        fallback={<div className="search-loading">Loading search…</div>}
      >
        <SearchExperience initialHomes={homes} key={urlStateKey} />
      </Suspense>
    </main>
  );
}
