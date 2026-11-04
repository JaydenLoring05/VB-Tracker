import type { Metadata } from "next";
import { ArrowRight, Check, Clock, ShieldPlus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { TodayPreview } from "@/components/join/TodayPreview";
import { Brand } from "@/components/shared/Brand";
import { BADGES } from "@/lib/badges";
import { ATHLETE_PLAN } from "@/lib/billing";
import { CONTACT_EMAIL } from "@/lib/contact";
import { LEVELS } from "@/lib/progression";
import { pageMetadata } from "@/lib/site";

import "@/styles/landing.css";
import "@/styles/pilot.css";
import "@/styles/dashboard.css";
import "@/styles/join.css";

export const metadata: Metadata = pageMetadata({
  title: "Jump higher. Get stronger.",
  description:
    "A training plan for any athlete who wants to jump higher, get stronger and stay healthy. Adapts to your level and to injuries. $14.99/month with a 7-day free trial.",
  path: "/join",
  shareTitle: "NextRep: jump higher, get stronger, train like a college athlete",
  shareDescription: "Daily workouts that adapt to your level and to injuries, with streaks, levels and badges."
});

const SIGN_UP = "/login?mode=sign-up";

const BENEFITS = [
  {
    icon: Clock,
    title: "20-60 minutes a day",
    body: "One workout a day, laid out for you: jumps, strength, landing practice and shoulder care. Open the app, tap Start, follow along."
  },
  {
    icon: ShieldPlus,
    title: "Works around injuries",
    body: "Flag a sore knee, shoulder, back or ankle and the plan swaps in joint-friendly exercises, cuts the risky volume and adds rehab work."
  },
  {
    icon: SlidersHorizontal,
    title: "Fits your level and age",
    body: "Beginner to advanced, 10 years old to college. Exercises and sets change to match you, and each week adjusts to how you recover."
  }
];

const PLAN_POINTS = [
  "Your plan, picked from your age, level, goal and injuries",
  "Workout Mode with cues, demos and a rest timer",
  "Streaks, levels, badges and a weekly challenge",
  "Jump and PR tracking with charts",
  "Cancel anytime"
];

const FAQS = [
  {
    question: "Do I need equipment?",
    answer:
      "Jump days, landing practice, mobility and core use just your body. Strength days use basic gym gear: dumbbells, a kettlebell and bands cover most of it. Every exercise lists swaps, and the beginner and under-14 versions skip heavy barbell lifts."
  },
  {
    question: "What if something hurts?",
    answer:
      "Tell the app in your setup or in the 30-second daily check-in. Knee, shoulder, lower-back and ankle pain change that day's workout: joint-friendly swaps, less jumping or overhead work, and rehab exercises. NextRep isn't medical advice; if pain keeps coming back, see an athletic trainer, physio or doctor."
  },
  {
    question: "I don't play volleyball. Does it work for me?",
    answer:
      "Yes, if your sport needs you to jump, sprint or be strong: basketball, soccer, track, football and more. The plan was built from college volleyball training, so jumping and landing are front and centre."
  },
  {
    question: "Is it OK for kids?",
    answer:
      "Yes. Athletes under 14 get a youth version: bodyweight and light-implement strength, no heavy barbell lifts or depth jumps, and landing practice on every jump day. Under 13, a parent or guardian gives consent at sign-up."
  },
  {
    question: "How does the free trial work?",
    answer: `Create your account for free and start training. When you're ready, start the ${ATHLETE_PLAN.trialDays}-day free trial from Settings; after it, the plan is ${ATHLETE_PLAN.priceLabel}. Cancel anytime before it ends and you won't be charged.`
  },
  {
    question: "I'm on a team. Can my coach use it?",
    answer:
      "Yes. Coaches can build or assign programs, see check-ins and track the team. Ask your coach for an invite code, or train solo."
  }
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
            <Link href={SIGN_UP} className="btn">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero join-hero">
          <div className="join-inner">
            <p className="micro micro-gold">For athletes of any age</p>
            <h1>
              Jump higher. Get stronger. <span className="landing-hero-accent">Train like a college athlete.</span>
            </h1>
            <p className="landing-hero-sub">
              20-60 minutes a day. A plan that fits your age, your level and your goal, and works around a sore knee
              or shoulder.
            </p>
            <div className="landing-hero-actions">
              <Link href={SIGN_UP} className="btn btn-lg">
                Start free <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/demo" className="btn ghost btn-lg">
                See the app
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="join-today">
          <div className="join-inner join-today">
            <div>
              <h2 id="join-today" className="landing-section-title">
                Open the app. Tap Start.
              </h2>
              <p className="landing-section-lead">
                Your Today screen shows one thing: today&apos;s workout. Recovery, progress and PRs are a tap away.
                Rest days give you a recovery tip instead.
              </p>
            </div>
            <TodayPreview />
          </div>
        </section>

        <section className="landing-section landing-section-alt" aria-labelledby="join-levels">
          <div className="join-inner">
            <h2 id="join-levels" className="landing-section-title">
              Level up every workout
            </h2>
            <p className="landing-section-lead">
              Earn XP for every workout and PR. Keep your streak alive (a freeze saves it when you miss a day) and
              unlock badges.
            </p>
            <ol className="join-levels" aria-label="Levels">
              {LEVELS.map((level) => (
                <li key={level.name}>
                  <strong>{level.name}</strong>
                  <span className="muted">{level.minXp === 0 ? "Start" : `${level.minXp.toLocaleString("en-US")} XP`}</span>
                </li>
              ))}
            </ol>
            <ul className="join-badges" aria-label="Badges">
              {BADGES.map((badge) => (
                <li key={badge.id}>
                  <span aria-hidden="true">{badge.icon}</span>
                  <strong>{badge.name}</strong>
                  <span className="muted">{badge.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="join-benefits">
          <div className="join-inner">
            <h2 id="join-benefits" className="landing-section-title">
              Built around you
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

        <section className="landing-section landing-section-alt" aria-labelledby="join-price">
          <div className="join-inner">
            <h2 id="join-price" className="landing-section-title">
              One simple price
            </h2>
            <div className="panel join-price-card">
              <p className="micro micro-gold">{ATHLETE_PLAN.name}</p>
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
              <Link href={SIGN_UP} className="btn">
                Start free
              </Link>
              <p className="muted join-price-note">
                Creating your account is free. Start your {ATHLETE_PLAN.trialDays}-day trial from Settings when
                you&apos;re ready.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="join-faq">
          <div className="join-inner">
            <h2 id="join-faq" className="landing-section-title">
              Questions
            </h2>
            <div className="landing-faq-list">
              {FAQS.map((item) => (
                <details className="landing-faq-item" key={item.question}>
                  <summary>{item.question}</summary>
                  <p className="muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-alt" aria-labelledby="join-founder">
          <div className="join-inner join-founder">
            <h2 id="join-founder" className="landing-section-title">
              Why I built NextRep
            </h2>
            <p>
              I&apos;m Jayden Loring, a college volleyball player and youth coach. College athletes get a strength
              coach, a plan and someone watching their knees and shoulders. Most athletes don&apos;t, especially
              younger ones. NextRep is the training I wish I&apos;d had growing up, in your pocket.
            </p>
            <p className="muted">Jayden Loring, founder</p>
          </div>
        </section>

        <section className="landing-section join-signup" aria-labelledby="join-start">
          <div className="join-inner">
            <h2 id="join-start" className="landing-section-title">
              Start today
            </h2>
            <p className="landing-section-lead">Your first workout is a minute away.</p>
            <div className="landing-hero-actions">
              <Link href={SIGN_UP} className="btn btn-lg">
                Start free <ArrowRight size={18} aria-hidden="true" />
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
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
}
