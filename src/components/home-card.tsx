import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import type { Home } from "@/server/data/homes";

export function HomeCard({ home }: { home: Home }) {
  return (
    <article className="home-card">
      <div className="home-image-wrap">
        <Link href={`/homes/${home.id}`} aria-label={`View ${home.title}`}>
          <span className="home-image-placeholder">Photos coming soon</span>
        </Link>
        <button
          type="button"
          className="heart-button"
          aria-label={`Save ${home.title}`}
        >
          <Heart size={20} />
        </button>
      </div>
      <div className="home-details">
        <div className="home-meta">
          <span>
            <MapPin size={14} /> {home.location}
          </span>
        </div>
        <h3>
          <Link href={`/homes/${home.id}`}>{home.title}</Link>
        </h3>
        <p>
          {home.type} · Sleeps {home.guests}
        </p>
      </div>
    </article>
  );
}
