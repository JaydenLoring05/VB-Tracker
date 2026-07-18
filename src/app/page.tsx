import { AlertTriangle, Eye, HeartPulse, Link2, ShieldCheck, Trophy, Users } from "lucide-react";
import Link from "next/link";

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

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1>
            A dashboard that helps volleyball coaches keep every athlete&apos;s training and
            recovery on track — so nobody falls through the cracks before playoffs.
          </h1>

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
            <p>
              The training program isn&apos;t a generic template — it&apos;s built on
              phase-based periodization: foundation, build, power, and taper phases that shift
              volume and intensity across the season instead of running the same workout on
              repeat for months. Exercise selection targets the injury patterns volleyball
              actually produces: shoulder-health work for hitters logging thousands of overhead
              swings, and landing-mechanics and hip-stability training aimed at reducing
              ACL-injury risk on landings and cuts. It&apos;s the kind of programming a strength
              coach would build for a volleyball team specifically, not a fitness app&apos;s
              workout of the day.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Built by someone who&apos;s lived it</h2>

          <div className="landing-about">
            <p>
              I&apos;m Jayden Loring. I&apos;ve played volleyball at the college level for two
              years now, including a stint as team captain, and I&apos;m studying Computer
              Science, I built this whole app myself. I didn&apos;t want another generic fitness
              template made by people who&apos;ve never actually been on a roster, so I built the
              tool I wished I&apos;d had: something that understands what a season really looks
              like, because I&apos;ve lived it from both sides, as a player logging the work and
              as a captain trying to keep track of everyone else&apos;s.
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
          <h2 className="landing-section-title">What coaches are saying</h2>
          <div className="empty-state landing-testimonial-placeholder">
            <p className="muted">Coach testimonials coming soon — check back after the pilot season.</p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt landing-contact">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Questions before you start?</h2>
          <p className="muted">
            Reach out directly — happy to talk through how it&apos;d work for your team.
          </p>
          <a href="mailto:hello@elevateos.com">
            <button type="button">Email hello@elevateos.com</button>
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="muted">🏐 ElevateOS</p>
      </footer>
    </div>
  );
}
