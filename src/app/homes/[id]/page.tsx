import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Check,
  Heart,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { getPublishedHomeById } from "@/server/data/homes";

type HomeDetailPageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: HomeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const home = await getPublishedHomeById(id);
  return home
    ? {
        title: `${home.title} in ${home.location} — Swapp`,
        description: `Explore this ${home.type.toLowerCase()} in ${home.location} for a home exchange.`,
      }
    : { title: "Home not found — Swapp" };
}

export default async function HomeDetailPage({ params }: HomeDetailPageProps) {
  const { id } = await params;
  const home = await getPublishedHomeById(id);
  if (!home) notFound();

  return (
    <main className="detail-page">
      <Header solid />
      <div className="detail-container container">
        <Link href="/search" className="detail-back">
          <ArrowLeft size={16} aria-hidden="true" /> Back to search
        </Link>
        <div className="detail-heading">
          <div>
            <span className="kicker">Home exchange</span>
            <h1>{home.title}</h1>
            <p>
              <MapPin size={16} aria-hidden="true" />
              {home.location}, {home.country}
            </p>
          </div>
          <div className="detail-actions">
            <button type="button">
              <Share2 size={17} /> Share
            </button>
            <button type="button">
              <Heart size={17} /> Save
            </button>
          </div>
        </div>

        {home.photos.length ? (
          <div className="detail-gallery">
            {home.photos.slice(0, 5).map((photo) => (
              // The application image proxy enforces Storage RLS before streaming.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={photo.url} alt={photo.alt} />
            ))}
          </div>
        ) : (
          <div className="detail-gallery detail-gallery-empty">
            <span>Photos have not been added for this home yet.</span>
          </div>
        )}

        <div className="detail-layout">
          <div className="detail-content">
            <section className="detail-summary">
              <h2>
                {home.type} in {home.location}
              </h2>
              <div className="detail-facts">
                <span>
                  <Users /> Sleeps {home.guests}
                </span>
              </div>
            </section>

            <section className="detail-section">
              <h2>About this home</h2>
              <p>
                The member has not added a public home description yet. Exchange
                details will be agreed together before confirmation.
              </p>
            </section>

            <section className="detail-section">
              <h2>What this place offers</h2>
              {home.amenities.length ? (
                <ul className="amenity-list">
                  {home.amenities.map((amenity) => (
                    <li key={amenity}>
                      <Check /> {amenity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Amenities have not been added yet.</p>
              )}
            </section>

            <section className="detail-section">
              <h2>Available for exchange</h2>
              {home.availability.length ? (
                <ul className="amenity-list">
                  {home.availability.map((window) => (
                    <li key={`${window.startsOn}-${window.endsOn}`}>
                      <CalendarRange aria-hidden="true" />
                      {formatDate(window.startsOn)}–{formatDate(window.endsOn)}
                      <span> · {window.minimumNights}+ nights</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>This member has not published an availability window yet.</p>
              )}
            </section>

            <section className="detail-section location-privacy">
              <MapPin aria-hidden="true" />
              <div>
                <h2>Approximate location</h2>
                <p>
                  {home.location}, {home.country}. The exact address stays
                  private until an exchange is confirmed by both households.
                </p>
              </div>
            </section>
          </div>

          <aside className="exchange-card">
            <span className="kicker">Plan an exchange</span>
            <h2>Interested in this home?</h2>
            <p>
              Share your dates and home with this member to see whether your
              travel plans align.
            </p>
            <button className="button" type="button">
              Propose an exchange
            </button>
            <small>
              No booking or nightly fee. You both confirm the details.
            </small>
          </aside>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
