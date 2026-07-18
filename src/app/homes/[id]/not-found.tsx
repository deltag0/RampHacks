import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Header } from "@/components/header";

export default function HomeNotFound() {
  return (
    <main className="detail-page">
      <Header solid />
      <section className="not-found-state container">
        <span><Home aria-hidden="true" /></span>
        <h1>This home is no longer available</h1>
        <p>
          It may be unpublished or the link may be out of date. Explore current
          homes to find another exchange partner.
        </p>
        <Link href="/search" className="button">
          <Search size={17} aria-hidden="true" /> Explore homes
        </Link>
      </section>
    </main>
  );
}
