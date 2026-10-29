import type { Metadata } from "next";
import { ArrowRight, Check, ClipboardList, HeartPulse, LineChart, ShieldPlus, SlidersHorizontal, Target } from "lucide-react";
import Link from "next/link";

import { WaitlistForm } from "@/components/join/WaitlistForm";
import { Brand } from "@/components/shared/Brand";
import { ATHLETE_PLAN } from "@/lib/billing";
import { CONTACT_EMAIL } from "@/lib/contact";
import { pageMetadata } from "@/lib/site";

import "@/styles/landing.css";
import "@/styles/pilot.css";
import "@/styles/join.css";

export const metadata: Metadata = pageMetadata({
  title: "Your volleyball training plan, built around you",
  description:
    "A personalized volleyball training plan that adapts to your level and works around a sore knee or shoulder. $14.99/month with a 7-day free trial.",
  path: "/join",
  shareTitle: "NextRep: a volleyball training plan that adapts to you",
  shareDescription:
    "Personalized jump, strength and shoulder training for volleyball athletes. Adapts to your level and to injuries."
});

const BENEFITS = [
  {
    icon: Target,
    title: "Built for volleyball",
    body: "A 20-week plan for jumping higher, hitting harder and staying healthy: jump work, strength, landing practice and shoulder care."
  },
  {
    icon: ShieldPlus,
    title: "Works around injuries",
    body: "Flag a sore knee or shoulder and the plan swaps in joint-friendly exercises, cuts the risky volume and adds rehab work."
  },
  {
    icon: SlidersHorizontal,
    title: "Fits your level",
    body: "Beginner, intermediate or advanced: sets and exercise picks change to match where you are, and each week adjusts to how you recover."
  }
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us about you",
    body: "Your level, your age group, anything that hurts, and your practice days. It takes about a minute."
  },
  {
    icon: HeartPulse,
    title: "Get your plan",
    body: "Your week is laid out day by day, with demos and cues for each exercise and a rest timer in Workout Mode."
  },
  {
    icon: LineChart,
    title: "Train and check in",
    body: "Log your sets and a quick daily check-in. The plan lightens up after rough weeks and keeps you on track."
  }
];

const PLAN_POINTS = [
  "Your personalized 20-week plan",
  "Injury and level adjustments",
  "Workout Mode, PR tracking and progress charts",
  "Cancel anytime"
];

export default function JoinPage() {
  return (
    <div className="landing-page join-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/join" className="landing-brand" aria-label="NextRep">
            <Brand />
          </Link>
          <nav className="landing-header-nav" aria-label="Account">
            <Link href="/login">Log in</Link>
            <a href="#sign-up" className="btn">
              Get early access
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero join-hero">
          <div className="join-inner">
            <p className="micro micro-gold">For volleyball athletes</p>
            <h1>
              Your volleyball training plan.{" "}
              <span className="landing-hero-accent">Built around you.</span>
            </h1>
            <p className="landing-hero-sub">
              Get a personalized plan to jump higher and stay healthy. It adapts to your level, and if your knee or
              shoulder is bothering you, it works around that too.
            </p>
            <div className="landing-hero-actions">
              <a href="#sign-up" className="btn btn-lg">
                Get early access <ArrowRight size={18} aria-hidden="true" />
              </a>
              <Link href="/demo" className="btn ghost btn-lg">
                See the app
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="join-benefits">
          <div className="join-inner">
            <h2 id="join-benefits" className="landing-section-title">
              Why NextRep
            </h2>
            <ul className="join-cards">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <li className="panel join-card" key={title}>
                  <Icon size={22} className="join-card-icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p className="muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-section landing-section-alt" aria-labelledby="join-how">
          <div className="join-inner">
            <h2 id="join-how" className="landing-section-title">
              How it works
            </h2>
            <ol className="join-steps">
              {STEPS.map(({ icon: Icon, title, body }, index) => (
                <li className="join-step" key={title}>
                  <span className="join-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3>
                      <Icon size={18} aria-hidden="true" /> {title}
                    </h3>
                    <p className="muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="join-price">
          <div className="join-inner">
            <h2 id="join-price" className="landing-section-title">
              One simple price
            </h2>
            <div className="panel join-price-card">
              <p className="micro micro-gold">Athlete plan · coming soon</p>
              <p className="join-price">
                <span className="join-price-amount">$14.99</span>
                <span className="muted">/month</span>
              </p>
              <p className="join-price-trial">{ATHLETE_PLAN.trialDays}-day free trial</p>
              <ul className="pilot-points">
                {PLAN_POINTS.map((point) => (
                  <li key={point}>
                    <Check size={18} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <a href="#sign-up" className="btn">
                Join the early access list
              </a>
              <p className="muted join-price-note">
                Payments aren&apos;t open yet. Sign up below and we&apos;ll email you when your free trial is ready.
              </p>
            </div>
          </div>
        </section>

        <section id="sign-up" className="landing-section landing-section-alt join-signup" aria-labelledby="join-signup">
          <div className="join-inner">
            <h2 id="join-signup" className="landing-section-title">
              Get early access
            </h2>
            <p className="landing-section-lead">
              Leave your name and email and we&apos;ll let you know when the athlete plan opens.
            </p>
            <WaitlistForm />
            <p className="muted join-account-note">
              Want to start training today? <Link href="/login?mode=sign-up">Create a free account</Link>. Already
              have one? <Link href="/login">Log in</Link>.
            </p>
            <p className="muted join-disclaimer">
              NextRep is a training tool, not medical advice. If pain persists, follow your athletic trainer, physio
              or doctor.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p className="landing-footer-brand">
          <Brand size={28} />
        </p>
        <p className="muted landing-footer-contact">
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <nav className="landing-footer-links" aria-label="Footer">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
}
