import Link from "next/link";

import { Brand } from "@/components/shared/Brand";

// Absolute hashes so the section links also work from /pilot, /privacy and /terms.
export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link href="/" className="landing-brand" aria-label="NextRep home">
          <Brand />
        </Link>

        <nav className="landing-header-links" aria-label="Page sections">
          <Link href="/#product-preview">Product</Link>
          <Link href="/#for-coaches">For Coaches</Link>
          <Link href="/#for-athletes">For Athletes</Link>
          <Link href="/#pricing">Pricing</Link>
        </nav>

        <nav className="landing-header-nav" aria-label="Account">
          <Link href="/login">Log in</Link>
          <Link href="/pilot" className="btn">
            Start Free Pilot
          </Link>
        </nav>
      </div>
    </header>
  );
}
