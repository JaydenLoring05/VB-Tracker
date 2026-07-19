import { AlertTriangle, Eye, HeartPulse, Link2, ShieldCheck, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { CONTACT_EMAIL } from "@/lib/contact";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { PricingSection } from "@/components/landing/PricingSection";

import "@/styles/landing.css";

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: "Notes live everywhere and nowhere",
    body: "Training notes end up scattered across a phone, a group chat, or a notebook that stays in someone's bag — by week six, nobody remembers who's been consistent and who's fallen off."
  },
  {
    icon: HeartPulse,
    title: "No early warning",
    body: "An athlete who's overtraining, under-sleeping, or quietly nursing a sore knee doesn't show up on a coach's radar until they're already hurt or burned out."
  },
  {
    icon: Users,
    title: "No single view of the team",
    body: "Sixteen athletes means sixteen different stories, tracked sixteen different ways — and no one place that puts them side by side."
  }
];

const STAT_CALLOUTS = [
  { value: "20", label: "Week Program" },
  { value: "4", label: "Training Phases" },
  { value: "10", label: "Exercise Categories" },
  { value: "80+", label: "Curated Exercises" }
];

const STEPS = [
  {
    icon: Trophy,
    title: "Create a team",
    body: "Set up your roster in a minute and get a unique invite code to share with your athletes."
  },
  {
    icon: Link2,
    title: "Athletes join with a code",
    body: "Each athlete signs up and enters your invite code — no separate accounts to manage, no spreadsheets to update."
  },
  {
    icon: Eye,
    title: "See the whole picture",
    body: "Recovery trends, training consistency, and who needs a check-in — all in one roster view, updated as your athletes log in."
  }
];

const PILOT_POINTS = [
  {
    icon: Trophy,
    title: "What your team gets",
    body: "A full 90-day pilot season at no cost, direct access to me while I build, and priority say in what gets built next."
  },
  {
    icon: Users,
    title: "What we ask in return",
    body: "Honest feedback as your team uses it week to week, and a short case study or quote once the pilot season wraps."
  }
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1>Know who&apos;s ready. Know who needs attention.</h1>
          <p className="landing-hero-sub muted">
            Helps volleyball coaches monitor training, recovery, soreness, and athlete progress
            from one team dashboard.
          </p>

          <div className="landing-hero-actions">
            <Link href="/login?mode=sign-up">
              <button type="button">Start a free pilot</button>
            </Link>
            <Link href="/login">
              <button type="button" className="ghost">
                Log in
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section landing-stats">
        <div className="landing-section-inner landing-stat-row">
          {STAT_CALLOUTS.map((stat) => (
            <div className="landing-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span className="muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Training visibility usually breaks down</h2>

          <div className="landing-problem-grid">
            {PROBLEMS.map((item) => {
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

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="panel landing-philosophy">
            <h2 className="landing-section-title">
              <ShieldCheck size={24} /> Why the program is built the way it is
            </h2>
            <p className="muted">
              Not a generic template -- built on phase-based periodization and volleyball&apos;s
              actual injury patterns.
            </p>

            <div className="landing-philosophy-points">
              <div>
                <strong>Phase-based periodization</strong>
                <p className="muted">
                  Foundation, build, power, and taper phases shift volume and intensity across
                  the season instead of running the same workout on repeat for months.
                </p>
              </div>
              <div>
                <strong>Volleyball-specific injury targeting</strong>
                <p className="muted">
                  Shoulder-health work for hitters logging thousands of overhead swings, and
                  landing-mechanics and hip-stability training aimed at reducing ACL-injury risk
                  on landings and cuts.
                </p>
              </div>
              <div>
                <strong>Built like a real strength program</strong>
                <p className="muted">
                  The kind of programming a strength coach would build for a volleyball team
                  specifically, not a fitness app&apos;s workout of the day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Built by someone who&apos;s lived it</h2>

          <div className="landing-about">
            <p>
              I&apos;m Jayden Loring, a collegiate volleyball player, former team captain, and
              Computer Science student. I built this because I lived the problem — training
              plans, soreness updates, and player progress scattered across group chats,
              notebooks, and memory. This is the system I wish my own teams had.
            </p>

            <ul className="landing-about-facts">
              <li>Team Captain, Varsity Volleyball — Durango High School (Las Vegas, NV)</li>
              <li>Advanced Honors Diploma, graduated 2024</li>
              <li>Two-time First Team All-Conference (SNVCA, 2023 &amp; 2024)</li>
              <li>AVCA Western Region Player of the Week (2023)</li>
              <li>Top-5 National Statistical Leader, Men&apos;s High School Volleyball (2023)</li>
            </ul>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Founding Team Pilot</h2>
          <p className="landing-section-lead">
            Looking for a handful of teams to run the first full season on ElevateOS.
          </p>

          <div className="landing-problem-grid landing-pilot-grid">
            {PILOT_POINTS.map((item) => {
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

          <div className="landing-pilot-cta">
            <a href={`mailto:${CONTACT_EMAIL}?subject=Founding Team Pilot`}>
              <button type="button">Apply for the Pilot</button>
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt landing-contact">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Questions before you start?</h2>
          <p className="muted">
            Reach out directly — happy to talk through how it&apos;d work for your team.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <button type="button">Email {CONTACT_EMAIL}</button>
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="muted">🏐 ElevateOS</p>
        <nav className="landing-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
}
