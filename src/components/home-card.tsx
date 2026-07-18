import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import type { Home } from "@/server/data/homes";

export function HomeCard({ home }: { home: Home }) {
  return (
    <article className="home-card">
      <div className="home-image-wrap">
        <Link href={`/homes/${home.id}`} aria-label={`View ${home.title}`}>
        <img src={home.image} alt={home.title} className="home-image" />
        </Link>
        {home.badge && <span className="image-badge">{home.badge}</span>}
        <button type="button" className="heart-button" aria-label={`Save ${home.title}`}><Heart size={20} /></button>
      </div>
      <div className="home-details">
        <div className="home-meta"><span><MapPin size={14} /> {home.location}</span><span><Star size={14} fill="currentColor" /> {home.rating}</span></div>
        <h3><Link href={`/homes/${home.id}`}>{home.title}</Link></h3>
        <p>{home.type} · {home.beds} beds · Sleeps {home.guests}</p>
        <div className="member-row">
          <span className="avatar">{home.member.initials}</span>
          <span>Home of {home.member.name}<small>{home.member.exchanges} exchanges</small></span>
        </div>
      </div>
    </article>
  );
}
