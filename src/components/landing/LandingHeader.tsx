import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <div className="landing-brand">
          <div className="landing-brand-logo">🏐</div>
          <div>
            <h2>NEXTREP</h2>
            <p>ATHLETE OPERATING SYSTEM</p>
          </div>
        </div>

        <nav className="landing-header-links">
          <a href="#product-preview">Product</a>
          <a href="#for-coaches">For Coaches</a>
          <a href="#for-athletes">For Athletes</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <nav className="landing-header-nav">
          <Link href="/login">Log in</Link>
          <Link href="/pilot">
            <button type="button">Start Free Pilot</button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
