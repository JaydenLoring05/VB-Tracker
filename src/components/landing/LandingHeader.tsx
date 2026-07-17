import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <div className="landing-brand">
          <div className="landing-brand-logo">🏐</div>
          <div>
            <h2>VOLLEYBALL TRACKER</h2>
            <p>ATHLETE OPERATING SYSTEM</p>
          </div>
        </div>

        <nav className="landing-header-nav">
          <Link href="/login">Log in</Link>
          <Link href="/login?mode=sign-up">
            <button type="button">Start a free pilot</button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
