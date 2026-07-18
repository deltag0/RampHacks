import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { HomeCard } from "@/components/home-card";
import { homes } from "@/server/data/homes";

const destinations = [
  {
    name: "Lisbon",
    country: "Portugal",
    image:
      "https://images.unsplash.com/photo-1525207934214-58e69a8f8a93?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Copenhagen",
    country: "Denmark",
    image:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Kyoto",
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <Header />
        <div className="hero-content container">
          <div className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            A better way to see the world
          </div>
          <h1>Go somewhere new.<br />Feel right at home.</h1>
          <p className="hero-copy">
            Swap homes with people you can trust. Stay longer, travel deeper,
            and skip the hotel bill.
          </p>
          <form className="search-bar" action="/search">
            <label>
              <span>Where do you want to go?</span>
              <span className="search-input">
                <MapPin size={19} aria-hidden="true" />
                <input name="destination" placeholder="City, country, or region" />
              </span>
            </label>
            <div className="search-divider" />
            <label>
              <span>When?</span>
              <span className="search-input">
                <CalendarDays size={19} aria-hidden="true" />
                <input name="dates" placeholder="Add dates" />
              </span>
            </label>
            <div className="search-divider" />
            <label>
              <span>Travelers</span>
              <span className="search-input">
                <Users size={19} aria-hidden="true" />
                <input name="travelers" placeholder="2 people" />
              </span>
            </label>
            <button className="search-submit" type="submit" aria-label="Search homes">
              <Search size={20} />
              <span>Search</span>
            </button>
          </form>
          <div className="trust-row">
            <span><Check size={14} /> No nightly fees</span>
            <span><Check size={14} /> Verified community</span>
            <span><Check size={14} /> Support whenever you need it</span>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="kicker">Member favorites</span>
            <h2>Homes worth swapping for</h2>
          </div>
          <Link href="/search" className="text-link">Explore all homes <ArrowRight size={17} /></Link>
        </div>
        {homes.length > 0 ? (
          <div className="card-grid">
            {homes.slice(0, 3).map((home) => <HomeCard home={home} key={home.id} />)}
          </div>
        ) : (
          <div className="empty-state landing-empty">
            <HomeIcon />
            <h3>Homes are coming soon</h3>
            <p>Member homes will appear here once listings are available.</p>
          </div>
        )}
      </section>

      <section className="how-section">
        <div className="container">
          <div className="center-heading">
            <span className="kicker">Simple by design</span>
            <h2>Trade places in three easy steps</h2>
            <p>A thoughtful community and a simple process make every exchange feel natural.</p>
          </div>
          <div className="steps">
            <article>
              <span className="step-icon"><HomeIcon /></span>
              <span className="step-number">01</span>
              <h3>List your home</h3>
              <p>Share what makes your place special, from the sunny kitchen to the best café nearby.</p>
            </article>
            <article>
              <span className="step-icon"><Search size={24} /></span>
              <span className="step-number">02</span>
              <h3>Find your match</h3>
              <p>Discover members who want to visit your region while you explore theirs.</p>
            </article>
            <article>
              <span className="step-icon"><Heart size={24} /></span>
              <span className="step-number">03</span>
              <h3>Swap &amp; explore</h3>
              <p>Get to know each other, confirm the details, then travel like you belong there.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section container destinations-section">
        <div className="section-heading">
          <div>
            <span className="kicker">Find your next favorite place</span>
            <h2>Popular right now</h2>
          </div>
        </div>
        <div className="destination-grid">
          {destinations.map((destination) => (
            <Link href={`/search?destination=${destination.name}`} className="destination-card" key={destination.name}>
              <img src={destination.image} alt={`${destination.name}, ${destination.country}`} />
              <span className="destination-overlay" />
              <span className="destination-info">
                <strong>{destination.name}</strong>
                <small>{destination.country}</small>
              </span>
              <span className="destination-arrow"><ArrowRight size={18} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="community-banner container">
        <div>
          <span className="kicker light">More than a place to stay</span>
          <h2>Travel with a community behind you.</h2>
          <p>Every member, home, and review is part of making Swapp a safer, kinder way to travel.</p>
          <Link href="/search" className="button button-light">Explore the community <ArrowRight size={17} /></Link>
        </div>
        <div className="community-points">
          <span><ShieldCheck size={24} /><strong>Thoughtful trust</strong><small>Profiles, reviews, and secure messaging help you swap with confidence.</small></span>
          <span><Users size={24} /><strong>Real connections</strong><small>Meet people who care about their homes, neighborhoods, and your experience.</small></span>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function HomeIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" />
    </svg>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <div><span className="brand footer-brand"><span className="brand-mark">S</span> swapp</span><p>Make the world feel a little more like home.</p></div>
        <div className="footer-links"><Link href="/search">Find a home</Link><a href="#">How it works</a><a href="#">Trust &amp; safety</a><a href="#">Help</a></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Swapp. All rights reserved.</span><span>Privacy · Terms · Cookies</span></div>
    </footer>
  );
}
