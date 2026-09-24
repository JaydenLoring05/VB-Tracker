import type { Metadata } from "next";
import { Check } from "lucide-react";
import Link from "next/link";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { PilotForm } from "@/components/pilot/PilotForm";

import "@/styles/landing.css";
import "@/styles/pilot.css";

export const metadata: Metadata = {
  title: "Apply for the Founding Team Pilot",
  description:
    "Apply to use NextRep free for 30 days with your volleyball team. No credit card, personal onboarding, and direct support from the founder.",
  alternates: { canonical: "/pilot" },
  openGraph: {
    title: "Apply for the NextRep Founding Team Pilot",
    description:
      "Use NextRep free for 30 days with your volleyball team. Three founding programs, personal onboarding, no credit card.",
    url: "/pilot"
  },
  twitter: {
    title: "Apply for the NextRep Founding Team Pilot",
    description:
      "Use NextRep free for 30 days with your volleyball team. Three founding programs, personal onboarding, no credit card."
  }
};

const POINTS = [
  "30 days free, no credit card required",
  "Jayden sets up your team with you, personally",
  "Early access to new features, in exchange for honest feedback",
  "Athletes join with a team code and never pay"
];

export default function PilotPage() {
  return (
    <div className="pilot-page">
      <LandingHeader />

      <main className="pilot-main">
        <div className="pilot-intro">
          <h1>Try NextRep free with your team for 30 days</h1>
          <p className="pilot-lead muted">
            We are choosing 3 volleyball programs as founding teams. Tell us a little about yours
            and we will reply by email.
          </p>
        </div>

        <PilotForm />

        <aside className="pilot-aside" aria-labelledby="pilot-includes">
          <h2 id="pilot-includes">What founding teams get</h2>
          <ul className="pilot-points">
            {POINTS.map((point) => (
              <li key={point}>
                <Check size={18} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="pilot-login-note muted">
            Already have a NextRep account? <Link href="/login">Log in</Link>
          </p>
        </aside>
      </main>

      <footer className="pilot-footer">
        <Link href="/">Home</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
      </footer>
    </div>
  );
}
