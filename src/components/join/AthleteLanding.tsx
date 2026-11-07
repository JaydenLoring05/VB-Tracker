import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  MoveUp,
  ShieldPlus,
  SlidersHorizontal,
  Trophy,
  Zap
} from "lucide-react";
import Link from "next/link";

import { ReferralCapture } from "@/components/join/ReferralCapture";
import { TodayPreview } from "@/components/join/TodayPreview";
import { Brand } from "@/components/shared/Brand";
import { ATHLETE_PLAN } from "@/lib/billing";
import { CONTACT_EMAIL } from "@/lib/contact";

/**
 * The athlete landing page (P-01), shown at / and /join. Section order and
 * headlines come from the coach's copy. Anything the app can't do yet is
 * labelled "Coming soon", and the price is read from ATHLETE_PLAN so the page
 * always matches what checkout charges.
 */

const SIGN_UP = "/login?mode=sign-up";
const TRIAL_CTA = `Start your ${ATHLETE_PLAN.trialDays}-day free trial`;
const [PRICE_AMOUNT, PRICE_PERIOD] = ATHLETE_PLAN.priceLabel.split("/");

const FOCUS_CARDS = [
  {
    icon: Zap,
    title: "Explosive power",
    body: "Plyometrics, med-ball throws and push presses that teach you to produce force fast, for a quicker approach and a harder swing."
  },
  {
    icon: MoveUp,
    title: "Vertical",
    body: "Approach and standing jump work every week, with landing practice so your knees can take the extra height."
  },
  {
    icon: Footprints,
    title: "Speed & agility",
    body: "Sprint starts, shuttle runs, lateral bounds and skater jumps for the first step to the ball and the close on a block."
  },
  {
    icon: Dumbbell,
    title: "Strength",
    body: "Squats, hinges, presses and pulls scaled to your level, plus the shoulder and core work that keeps you swinging all season."
  }
];

const ADAPTS = [
  {
    icon: CalendarCheck,
    title: "Fits around practice and games",
    body: "Tell it your practice days and game days. Legs stay fresh the day before a game, and the week moves around your schedule."
  },
  {
    icon: ShieldPlus,
    title: "Works around sore spots",
    body: "Flag a knee, shoulder, back or ankle and the plan swaps in joint-friendly exercises and adds rehab work."
  },
  {
    icon: SlidersHorizontal,
    title: "Matches your level",
    body: "Beginner, intermediate or advanced changes the exercises and the percent of your max you lift."
  },
  {
    icon: Gauge,
    title: "Doesn't pile on missed work",
    body: "Missed most of last week? It repeats the week to build the base instead of jumping ahead."
  }
];

const RESULTS = [
  { icon: MoveUp, title: "Vertical", body: "Log your standing and approach jump and see the chart climb.", soon: false },
  { icon: Dumbbell, title: "Strength", body: "Every set is saved, and a new best on any lift is flagged as a PR.", soon: false },
  { icon: Flame, title: "Consistency", body: "Streaks, weekly completion, levels and badges for showing up.", soon: false },
  { icon: Trophy, title: "PRs", body: "A celebration when you beat a best, and a card to share it.", soon: false },
  { icon: BarChart3, title: "Speed & agility", body: "10-yard sprint and pro-agility test days.", soon: true }
];

const PLAN_POINTS = [
  "A volleyball program for your position, level and age",
  "Workout Mode with cues, demos and a rest timer",
  "A plan that adjusts to practice, games and sore spots",
  "Vertical and PR tracking with charts",
  "Streaks, levels, badges and a weekly challenge",
  "Cancel anytime"
];

function ComingSoon() {
  return <span className="landing-soon">Coming soon</span>;
}

export function AthleteLanding() {
  return (
    <div className="landing-page join-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-brand" aria-label="NextRep home">
            <Brand />
          </Link>
          <nav className="landing-header-nav" aria-label="Account">
            <Link href="/pilot" className="join-coach-link">
              Coaches
            </Link>
            <Link href="/login">Log in</Link>
            <Link href={SIGN_UP} className="btn">
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* 1. Hero */}
        <section className="landing-hero join-hero">
          <div className="join-inner">
            <ReferralCapture />
            <h1>
              Every volleyball player deserves a strength coach.{" "}
              <span className="landing-hero-accent">Now every player can afford one.</span>
            </h1>
            <p className="landing-hero-sub">Your personal volleyball performance coach. Right in your pocket.</p>
            <div className="landing-hero-actions">
              <Link href={SIGN_UP} className="btn btn-lg">
                {TRIAL_CTA} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/demo" className="btn ghost btn-lg">
                See the app
              </Link>
            </div>
            <p className="muted join-hero-note">
              {ATHLETE_PLAN.priceLabel} after the trial. Cancel anytime.
            </p>
          </div>
        </section>

        {/* 2. Promise */}
        <section className="landing-section" aria-labelledby="land-promise">
          <div className="join-inner join-today">
            <div>
              <h2 id="land-promise" className="landing-section-title">
                Jump higher. Move faster. Get stronger.
              </h2>
              <p className="landing-section-lead">
                Personalized strength and conditioning built for volleyball: the jumps, lifts, landing work and
                shoulder care college players do, laid out day by day. Open the app, tap Start, follow along.
              </p>
            </div>
            <TodayPreview />
          </div>
        </section>

        {/* 3. Focus areas */}
        <section id="program" className="landing-section landing-section-alt" aria-labelledby="land-program">
          <div className="join-inner">
            <h2 id="land-program" className="landing-section-title">
              Your training. Your goals. Your program.
            </h2>
            <ul className="join-cards join-cards-4">
              {FOCUS_CARDS.map(({ icon: Icon, title, body }) => (
                <li className="panel join-card" key={title}>
                  <Icon size={22} className="join-card-icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p className="muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Adaptive */}
        <section id="adapts" className="landing-section" aria-labelledby="land-adapts">
          <div className="join-inner">
            <h2 id="land-adapts" className="landing-section-title">
              A coach that gets smarter with every workout
            </h2>
            <p className="landing-section-lead">
              Your plan adjusts every week, and tells you why: &ldquo;Game on Saturday: legs stay fresh the day
              before.&rdquo;
            </p>
            <ul className="join-cards join-cards-4">
              {ADAPTS.map(({ icon: Icon, title, body }) => (
                <li className="panel join-card" key={title}>
                  <Icon size={22} className="join-card-icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p className="muted">{body}</p>
                </li>
              ))}
            </ul>
            <p className="muted join-soon-line">
              <ComingSoon /> Season phases (off-season, preseason, in-season, club) and practice intensity, so a hard
              practice week trims your lifting automatically.
            </p>
          </div>
        </section>

        {/* 5. Results */}
        <section id="results" className="landing-section landing-section-alt" aria-labelledby="land-results">
          <div className="join-inner">
            <h2 id="land-results" className="landing-section-title">
              Real work. Real progress. Real results.
            </h2>
            <p className="landing-section-lead">Every rep you log is tracked, so you can see the work paying off.</p>
            <ul className="join-results">
              {RESULTS.map(({ icon: Icon, title, body, soon }) => (
                <li key={title}>
                  <Icon size={20} className="join-card-icon" aria-hidden="true" />
                  <div>
                    <strong>
                      {title} {soon && <ComingSoon />}
                    </strong>
                    <p className="muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Parents & coaches */}
        <section className="landing-section" aria-labelledby="land-viewers">
          <div className="join-inner">
            <ComingSoon />
            <h2 id="land-viewers" className="landing-section-title">
              Free access for parents &amp; coaches
            </h2>
            <p className="landing-section-lead">
              Invite a parent or coach to a free, read-only view of your workouts, streak, test results and PRs. No
              billing access, nothing to pay.
            </p>
            <p className="muted">
              Coaching a whole team today? <Link href="/pilot">Start the free team pilot</Link> or{" "}
              <Link href="/demo">see the coach dashboard</Link>.
            </p>
          </div>
        </section>

        {/* 7. Resume */}
        <section className="landing-section landing-section-alt" aria-labelledby="land-resume">
          <div className="join-inner">
            <ComingSoon />
            <h2 id="land-resume" className="landing-section-title">
              Build your athletic resume
            </h2>
            <p className="landing-section-lead">
              A page you can send to a college coach: position, grad year, test results over time, verified PRs,
              training consistency and a link to your highlight video.
            </p>
            <p className="muted">
              Today you can already share a progress card with your streak, level, badges and best jump.
            </p>
          </div>
        </section>

        {/* 8. Pricing */}
        <section id="pricing" className="landing-section" aria-labelledby="land-price">
          <div className="join-inner">
            <h2 id="land-price" className="landing-section-title">
              One simple price
            </h2>
            <div className="panel join-price-card">
              <p className="micro micro-gold">{ATHLETE_PLAN.name}</p>
              <p className="join-price">
                <span className="join-price-amount">{PRICE_AMOUNT}</span>
                {PRICE_PERIOD && <span className="muted">/{PRICE_PERIOD}</span>}
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
              <Link href={SIGN_UP} className="btn">
                {TRIAL_CTA}
              </Link>
              <p className="muted join-price-note">
                Creating your account is free. Start the trial from Settings when you&apos;re ready, and cancel
                before it ends to pay nothing. Under 13? A parent or guardian gives consent at sign-up.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Closing */}
        <section className="landing-section landing-section-alt join-signup" aria-labelledby="land-start">
          <div className="join-inner">
            <h2 id="land-start" className="landing-section-title">
              Your potential doesn&apos;t have to wait.
            </h2>
            <p className="landing-section-lead">Your first workout is a minute away.</p>
            <div className="landing-hero-actions">
              <Link href={SIGN_UP} className="btn btn-lg">
                {TRIAL_CTA} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <p className="muted join-account-note">
              Already have an account? <Link href="/login">Log in</Link>.
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
          <Link href="/pilot">For coaches</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
}
