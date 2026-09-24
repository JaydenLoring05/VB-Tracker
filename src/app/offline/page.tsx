import type { Metadata } from "next";

// Static fallback shown by the service worker (public/sw.js) when a navigation fails
// because the device is offline. It must stay fully static and self-contained: no user
// data, no data fetching, and inline styles so it renders even if no stylesheet is cached.

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false }
};

const styles = `
.offline-shell {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(60rem 26rem at 50% -8rem, rgba(229, 172, 76, 0.08), transparent 70%), #070503;
  color: #f5f1e9;
  font-family: var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: center;
}
.offline-card {
  width: min(100%, 380px);
  display: grid;
  justify-items: center;
  gap: 12px;
}
.offline-mark {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  color: #090704;
  background: #e5ac4c;
  box-shadow: 0 16px 40px -12px rgba(229, 172, 76, 0.45);
}
.offline-brand {
  margin: 12px 0 0;
  font-family: var(--font-barlow), "Arial Narrow", Arial, sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #f5f1e9;
}
.offline-title {
  margin: 0;
  font-family: var(--font-barlow), "Arial Narrow", Arial, sans-serif;
  font-size: 44px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  text-wrap: balance;
}
.offline-copy {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: #a09a91;
  text-wrap: pretty;
}
.offline-retry {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 28px;
  border-radius: 8px;
  background: #e5ac4c;
  color: #090704;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
}
.offline-retry:focus-visible {
  outline: 2px solid #f5c66d;
  outline-offset: 3px;
}
.offline-retry:active {
  transform: scale(0.97);
}
`;

export default function OfflinePage() {
  return (
    <main className="offline-shell">
      <style>{styles}</style>
      <div className="offline-card">
        <div className="offline-mark" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
          </svg>
        </div>
        <p className="offline-brand">
          NEXT<span style={{ color: "#e5ac4c" }}>REP</span>
        </p>
        <h1 className="offline-title">You are offline</h1>
        <p className="offline-copy">
          NextRep can&apos;t reach the network right now. Check your signal or Wi-Fi, then try
          again.
        </p>
        <a className="offline-retry" href="/">
          Try again
        </a>
      </div>
    </main>
  );
}
