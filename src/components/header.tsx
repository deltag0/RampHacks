import Link from "next/link";
import { Menu } from "lucide-react";

export function Header({ solid = false }: { solid?: boolean }) {
  return (
    <header className={solid ? "site-header solid" : "site-header"}>
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Swapp home"><span className="brand-mark">S</span> swapp</Link>
        <nav aria-label="Main navigation">
          <Link href="/search">Find a home</Link>
          <Link href="/tour-builder">Build a tour</Link>
          <a href="/#how-it-works">How it works</a>
          <a href="#">Trust &amp; safety</a>
        </nav>
        <div className="header-actions">
          <a href="#">Log in</a>
          <Link href="/tour-builder" className="button button-small">List your home</Link>
          <button className="menu-button" aria-label="Open menu"><Menu size={21} /></button>
        </div>
      </div>
    </header>
  );
}
