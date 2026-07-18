import { Header } from "@/components/header";
import { SearchExperience } from "@/components/search-experience";
import { homes } from "@/server/data/homes";

export default function SearchPage() {
  return (
    <main className="search-page">
      <Header solid />
      <SearchExperience initialHomes={homes} />
    </main>
  );
}
