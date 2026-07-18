import { Suspense } from "react";
import { Header } from "@/components/header";
import { SearchExperience } from "@/components/search-experience";
import { homes } from "@/server/data/homes";

export default function SearchPage() {
  return (
    <main className="search-page">
      <Header solid />
      <Suspense fallback={<div className="search-loading">Loading search…</div>}>
        <SearchExperience initialHomes={homes} />
      </Suspense>
    </main>
  );
}
