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
import { getPublishedHomes } from "@/server/data/homes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const homes = await getPublishedHomes();
  return (
    <main>
      <section className="hero">
        <Header />
        <div className="hero-content container">
          <div className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />A better way to see the
            world
          </div>
          <h1>
            Go somewhere new.
            <br />
            Feel right at home.
          </h1>
          <p className="hero-copy">
            Swap homes with people you can trust. Stay longer, travel deeper,
            and skip the hotel bill.
          </p>
          <form className="search-bar" action="/search">
            <label>
              <span>Where do you want to go?</span>
              <span className="search-input">
                <MapPin size={19} aria-hidden="true" />
                <input
                  name="destination"
                  placeholder="City, country, or region"
                />
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
            <button
              className="search-submit"
              type="submit"
              aria-label="Search homes"
            >
              <Search size={20} />
              <span>Search</span>
            </button>
          </form>
          <div className="trust-row">
            <span>
              <Check size={14} /> No nightly fees
            </span>
            <span>
              <Check size={14} /> Exact addresses stay private
            </span>
            <span>
              <Check size={14} /> Support whenever you need it
            </span>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="kicker">Member favorites</span>
            <h2>Homes worth swapping for</h2>
          </div>
          <Link href="/search" className="text-link">
            Explore all homes <ArrowRight size={17} />
          </Link>
        </div>
        {homes.length > 0 ? (
          <div className="card-grid">
            {homes.slice(0, 3).map((home) => (
              <HomeCard home={home} key={home.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state landing-empty">
            <HomeIcon />
            <h3>Homes are coming soon</h3>
            <p>Member homes will appear here once listings are available.</p>
          </div>
        )}
      </section>

      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="center-heading">
            <span className="kicker">Simple by design</span>
            <h2>Trade places in three easy steps</h2>
            <p>
              A thoughtful community and a simple process make every exchange
              feel natural.
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="step-icon">
                <HomeIcon />
              </span>
              <span className="step-number">01</span>
              <h3>List your home</h3>
              <p>
                Share what makes your place special, from the sunny kitchen to
                the best café nearby.
              </p>
            </article>
            <article>
              <span className="step-icon">
                <Search size={24} />
              </span>
              <span className="step-number">02</span>
              <h3>Find your match</h3>
              <p>
                Discover members who want to visit your region while you explore
                theirs.
              </p>
            </article>
            <article>
              <span className="step-icon">
                <Heart size={24} />
              </span>
              <span className="step-number">03</span>
              <h3>Swap &amp; explore</h3>
              <p>
                Get to know each other, confirm the details, then travel like
                you belong there.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="community-banner container">
        <div>
          <span className="kicker light">More than a place to stay</span>
          <h2>Travel with a community behind you.</h2>
          <p>
            Every member, home, and review is part of making Swapp a safer,
            kinder way to travel.
          </p>
          <Link href="/search" className="button button-light">
            Explore the community <ArrowRight size={17} />
          </Link>
        </div>
        <div className="community-points">
          <span>
            <ShieldCheck size={24} />
            <strong>Thoughtful trust</strong>
            <small>
              Profiles, reviews, and secure messaging help you swap with
              confidence.
            </small>
          </span>
          <span>
            <Users size={24} />
            <strong>Real connections</strong>
            <small>
              Meet people who care about their homes, neighborhoods, and your
              experience.
            </small>
          </span>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function HomeIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </svg>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner container">
        <div>
          <span className="brand footer-brand">
            <span className="brand-mark">S</span> swapp
          </span>
          <p>Make the world feel a little more like home.</p>
        </div>
        <div className="footer-links">
          <Link href="/search">Find a home</Link>
          <a href="#">How it works</a>
          <a href="#">Trust &amp; safety</a>
          <a href="#">Help</a>
        </div>
      </div>
      <div className="footer-bottom container">
        <span>© 2026 Swapp. All rights reserved.</span>
        <span>Privacy · Terms · Cookies</span>
      </div>
    </footer>
  );
}
