import Link from "next/link";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function Header({ solid = false }: { solid?: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  return (
    <header className={solid ? "site-header solid" : "site-header"}>
      <div className="header-inner container">
        <Link href="/" className="brand" aria-label="Swapp home">
          <span className="brand-mark">S</span> swapp
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/search">Search</Link>
          <Link href="/tour-builder">Build a tour</Link>
          <Link href="/#how-it-works">How it works</Link>
          <a href="#">Trust &amp; safety</a>
        </nav>
        <div className="header-actions">
          {isSignedIn ? (
            <>
              <Link href="/messages">Messages</Link>
              <Link href="/dashboard" className="button button-small">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">Log in</Link>
              <Link href="/auth/sign-up" className="button button-small">
                Join Swapp
              </Link>
            </>
          )}
          <button className="menu-button" aria-label="Open menu">
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}
