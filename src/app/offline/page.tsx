import type { Metadata } from "next";

// Static fallback shown by the service worker (public/sw.js) when a navigation fails
// because the device is offline. It must stay fully static and self-contained: no user
// data, no data fetching, and inline styles so it renders even if no stylesheet is cached.

export const metadata: Metadata = {
  title: "Offline | NextRep",
  robots: { index: false, follow: false }
};

const styles = `
.offline-shell {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at top, #151922 0, #05070a 48%, #020304 100%);
  color: #f4f6f8;
  font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
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
  border-radius: 22px;
  font-size: 40px;
  background: #101419;
  border: 1px solid #272d36;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}
.offline-brand {
  margin: 12px 0 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #ffc400;
}
.offline-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
.offline-copy {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: #aeb6c4;
  text-wrap: pretty;
}
.offline-retry {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffc400, #e7a900);
  color: #14110a;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
}
.offline-retry:focus-visible {
  outline: 2px solid #ffdd55;
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
          🏐
        </div>
        <p className="offline-brand">NEXTREP</p>
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
