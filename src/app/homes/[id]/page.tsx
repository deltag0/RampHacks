import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { getHomeById } from "@/server/data/homes";

type HomeDetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: HomeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const home = getHomeById(id);
  return home
    ? {
        title: `${home.title} in ${home.location} — Swapp`,
        description:
          home.description ??
          `Explore this ${home.type.toLowerCase()} in ${home.location} for a home exchange.`,
      }
    : { title: "Home not found — Swapp" };
}

export default async function HomeDetailPage({
  params,
}: HomeDetailPageProps) {
  const { id } = await params;
  const home = getHomeById(id);
  if (!home) notFound();

  const images = [...new Set([home.image, ...(home.images ?? [])])].slice(0, 5);

  return (
    <main className="detail-page">
      <Header solid />
      <div className="container detail-container">
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
              <span aria-hidden="true">·</span>
              <Star size={15} fill="currentColor" aria-hidden="true" />
              {home.rating}
            </p>
          </div>
          <div className="detail-actions">
            <button type="button"><Share2 size={17} /> Share</button>
            <button type="button"><Heart size={17} /> Save</button>
          </div>
        </div>

        <div className={`detail-gallery gallery-${Math.min(images.length, 5)}`}>
          {images.map((image, index) => (
            <img
              src={image}
              alt={index === 0 ? home.title : `${home.title}, view ${index + 1}`}
              key={image}
            />
          ))}
        </div>

        <div className="detail-layout">
          <div className="detail-content">
            <section className="detail-summary">
              <h2>
                {home.type} in {home.location}
              </h2>
              <div className="detail-facts">
                <span><Users /> Sleeps {home.guests}</span>
                <span><BedDouble /> {home.bedrooms ?? home.beds} bedrooms</span>
                <span><Bath /> {home.bathrooms ?? 1} bathrooms</span>
              </div>
            </section>

            <section className="member-profile">
              <span className="avatar detail-avatar">{home.member.initials}</span>
              <div>
                <h2>{home.member.name}&apos;s home</h2>
                <p>{home.member.exchanges} completed exchanges</p>
              </div>
              <ShieldCheck aria-label="Member trust profile available" />
            </section>

            <section className="detail-section">
              <h2>About this home</h2>
              <p>
                {home.description ??
                  "The member has not added a home description yet. Exchange details will be agreed together before confirmation."}
              </p>
            </section>

            <section className="detail-section">
              <h2>What this place offers</h2>
              {home.amenities.length ? (
                <ul className="amenity-list">
                  {home.amenities.map((amenity) => (
                    <li key={amenity}><Check /> {amenity}</li>
                  ))}
                </ul>
              ) : (
                <p>Amenities have not been added yet.</p>
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
              Share your dates and home with {home.member.name} to see whether
              your travel plans align.
            </p>
            <button className="button" type="button">Propose an exchange</button>
            <small>No booking or nightly fee. You both confirm the details.</small>
          </aside>
        </div>
      </div>
    </main>
  );
}
