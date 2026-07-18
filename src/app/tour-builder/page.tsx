import { Header } from "@/components/header";
import { HomeTourBuilder } from "@/components/home-tour-builder";

export default function TourBuilderPage() {
  return (
    <main className="tour-page">
      <Header solid />
      <section className="tour-page-intro container">
        <span className="kicker">Interactive home tour</span>
        <h1>Help exchange partners understand your space.</h1>
        <p>
          Connect room photos with directional arrows to create a simple,
          accessible walk-through of your home.
        </p>
      </section>
      <section className="container tour-builder-section">
        <HomeTourBuilder />
      </section>
    </main>
  );
}
