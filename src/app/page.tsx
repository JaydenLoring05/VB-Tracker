import { Activity, Bone, Calendar, HeartPulse, Link2, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { CONTACT_EMAIL } from "@/lib/contact";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { FAQSection } from "@/components/landing/FAQSection";
import { LandingAttentionDemo } from "@/components/landing/LandingAttentionDemo";
import { LandingDashboardMock } from "@/components/landing/LandingDashboardMock";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingWeeklyReport } from "@/components/landing/LandingWeeklyReport";
import { LandingWorkoutMock } from "@/components/landing/LandingWorkoutMock";
import { PricingSection } from "@/components/landing/PricingSection";
import { AttentionItem } from "@/lib/attentionCenter";

import "@/styles/landing.css";

const SAMPLE_ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "sample-pain",
    userId: "sample-1",
    displayName: "Maya Chen",
    priority: "high",
    reason: "Reported knee pain 3 days running",
    action: "Check in",
    signalDate: "2026-07-18"
  },
  {
    id: "sample-readiness",
    userId: "sample-2",
    displayName: "Jordan Park",
    priority: "high",
    reason: "Readiness dropped 24 points versus last week",
    action: "Review workload",
    signalDate: "2026-07-19"
  },
  {
    id: "sample-missed",
    userId: "sample-3",
    displayName: "Sam Rivera",
    priority: "medium",
    reason: "No completed workouts in the last 7 days",
    action: "Send reminder",
    signalDate: "2026-07-17"
  },
  {
    id: "sample-pr",
    userId: "sample-4",
    displayName: "Ava Thompson",
    priority: "positive",
    reason: "New PR: Vertical Jump",
    action: "Recognize achievement",
    signalDate: "2026-07-20"
  }
];

const CAPABILITIES = [
  {
    icon: Activity,
    title: "Jump Development",
    body: "A phase-based plyometric and strength progression that supports building explosive vertical power over a full season, not a single workout of the day."
  },
  {
    icon: Users,
    title: "Shoulder Durability",
    body: "Structured shoulder-health work built around the overhead swing volume hitters accumulate, aimed at supporting a healthy, durable shoulder over a long season."
  },
  {
    icon: Bone,
    title: "Knee & Landing Capacity",
    body: "Landing-mechanics and hip-stability training that helps identify patterns in how an athlete lands and cuts, and supports building better landing habits over time."
  },
  {
    icon: Calendar,
    title: "Season-Aware Programming",
    body: "Foundation, build, power, and taper phases shift volume and intensity across the season, and the team calendar keeps practices, matches, and tournaments part of the plan."
  }
];

const STEPS = [
  {
    icon: Trophy,
    title: "Create your team",
    body: "Set your season dates, training schedule, roster, and goals in a few minutes."
  },
  {
    icon: Link2,
    title: "Invite your athletes",
    body: "Share one team code. Each athlete signs up and joins, no spreadsheets, no separate accounts to manage."
  },
  {
    icon: HeartPulse,
    title: "Start developing",
    body: "Assign workouts and monitor readiness, consistency, and progress across the whole roster from one dashboard."
  }
];

const FOUNDING_PILOT_POINTS = [
  "30 days free",
  "No credit card required",
  "Personal onboarding",
  "Direct founder support",
  "Cancel anytime",
  "Limited number of teams"
];

const FOUNDER_CREDENTIALS = [
  "Team Captain, Varsity Volleyball, Durango High School (Las Vegas, NV)",
  "Two-time First Team All-Conference (SNVCA, 2023 & 2024)",
  "AVCA Western Region Player of the Week (2023)",
  "Top-5 National Statistical Leader, Men's High School Volleyball (2023)"
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <AnnouncementBar />
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1>Know who&apos;s ready. Know who needs attention.</h1>
          <p className="landing-hero-sub muted">
            NextRep gives volleyball teams structured workouts, daily readiness monitoring, and
            clear progress tracking, all from one coach dashboard.
          </p>

          <div className="landing-hero-actions">
            <Link href="/login?mode=sign-up">
              <button type="button">Start Free Team Pilot</button>
            </Link>
            <a href="#product-preview">
              <button type="button" className="ghost">
                View Demo Dashboard
              </button>
            </a>
          </div>

          <p className="muted landing-hero-reassurance">
            Free for 30 days &bull; No credit card &bull; Set up your team in minutes
          </p>
        </div>
      </section>

      <section id="product-preview" className="landing-section">
        <div className="landing-section-inner">
          <LandingDashboardMock />
        </div>
      </section>

      <section id="audiences" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">One system. Two connected experiences.</h2>

          <div className="landing-audience-grid">
            <div id="for-coaches" className="panel landing-audience-card">
              <h3>For Coaches</h3>
              <ul>
                <li>Roster-wide readiness at a glance</li>
                <li>Workout completion, tracked automatically</li>
                <li>Pain and discomfort trends across the team</li>
                <li>Progress tracking for every athlete on the roster</li>
              </ul>
              <a href="#attention-center-demo">
                <button type="button" className="secondary">
                  Explore Coach Features
                </button>
              </a>
            </div>

            <div id="for-athletes" className="panel landing-audience-card">
              <h3>For Athletes</h3>
              <ul>
                <li>Today&apos;s workout, with exercise demos and cues</li>
                <li>Personal records tracked automatically</li>
                <li>A daily readiness check-in that takes under a minute</li>
                <li>A clear view of your own progress over the season</li>
              </ul>
              <a href="#workout-preview">
                <button type="button" className="secondary">
                  Explore Athlete Features
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="attention-center-demo" className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Stop searching through data. See what matters today.</h2>
          <p className="landing-section-lead">
            A prioritized list of what needs a coach&apos;s attention, computed from real check-in
            and training data instead of raw numbers a coach has to interpret.
          </p>

          <LandingAttentionDemo items={SAMPLE_ATTENTION_ITEMS} />
          <p className="muted landing-mock-badge landing-mock-badge-standalone">Sample data</p>
        </div>
      </section>

      <section id="workout-preview" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">How workouts work</h2>
          <p className="landing-section-lead">
            Purpose, target, and previous performance sit right next to every exercise, with a
            rest timer and a substitute option built in.
          </p>

          <LandingWorkoutMock />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Built around the demands of volleyball</h2>

          <div className="landing-problem-grid">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <div className="panel landing-problem-card" key={item.title}>
                  <Icon size={22} />
                  <h3>{item.title}</h3>
                  <p className="muted">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">A clear weekly picture, not a data dump</h2>
          <LandingWeeklyReport />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">How it works</h2>

          <div className="landing-steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="landing-step" key={step.title}>
                  <div className="landing-step-number">{index + 1}</div>
                  <Icon size={22} />
                  <h3>{step.title}</h3>
                  <p className="muted">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="founding-pilot" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Become a Founding Team</h2>
          <p className="landing-section-lead">
            We&apos;re selecting 3 volleyball programs to use NextRep free for 30 days. Founding
            teams receive direct setup assistance and early access to new features in exchange
            for honest feedback.
          </p>

          <ul className="landing-founding-list">
            {FOUNDING_PILOT_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="landing-pilot-cta">
            <a href={`mailto:${CONTACT_EMAIL}?subject=Founding Team Pilot`}>
              <button type="button">Apply for Founding Team Access</button>
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Built by an athlete who experienced the problem</h2>

          <div className="landing-about">
            <p>
              I&apos;m Jayden Loring, a collegiate volleyball player, former team captain, and
              Computer Science student. I built NextRep because my teams never had one place to
              manage workouts, recovery, soreness, and athletic progress. NextRep is the system I
              wish we had.
            </p>

            <ul className="landing-about-facts">
              {FOUNDER_CREDENTIALS.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Frequently asked questions</h2>
          <FAQSection />
        </div>
      </section>

      <section className="landing-section landing-final-cta">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">
            Give every athlete a clear plan, and every coach a clearer picture.
          </h2>
          <p className="landing-section-lead">
            Start your free NextRep pilot and see your team&apos;s training, recovery, and
            progress in one place.
          </p>

          <div className="landing-hero-actions">
            <Link href="/login?mode=sign-up">
              <button type="button">Start Free Team Pilot</button>
            </Link>
            <a href="#product-preview">
              <button type="button" className="ghost">
                View Demo Dashboard
              </button>
            </a>
          </div>

          <p className="muted landing-hero-reassurance">
            No credit card &bull; Free onboarding &bull; Cancel anytime
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="muted">🏐 NextRep</p>
        <p className="muted landing-footer-contact">
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <nav className="landing-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
}
