import type { Metadata } from "next";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { CONTACT_EMAIL } from "@/lib/contact";

import "@/styles/landing.css";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What NextRep collects, who can see athlete and coach data, and how to ask for your data to be deleted. Written in plain language.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <LandingHeader />

      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated September 23, 2026.</p>

        <p>
          NextRep is a training and recovery tracker for volleyball teams. This page explains
          what we collect, who can see it, and how to get it deleted, in plain language,
          because you shouldn&apos;t need a lawyer to understand it.
        </p>

        <div className="legal-summary">
          <h2>The short version</h2>
          <ul>
            <li>You own the data you log. You can always see all of it.</li>
            <li>
              Your coach can see your check-ins, stats, and training progress, but only if you
              joined their team, and only in read-only form.
            </li>
            <li>Teammates and other teams cannot see your data.</li>
            <li>We don&apos;t sell your data or use it for advertising.</li>
            <li>
              To delete your account and your data, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </li>
          </ul>
        </div>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account:</strong> your email address, your name, and your password. Sign-in is
            handled by our database provider, which stores a hashed password. We never see or
            store it in readable form.
          </li>
          <li>
            <strong>Team:</strong> the team you create or join, your role (coach or athlete), and
            the team code used to join.
          </li>
          <li>
            <strong>Athlete profile:</strong> details you choose to enter, such as position,
            height, standing reach, approach and block touch, body weight, competitive level, and
            training goals.
          </li>
          <li>
            <strong>Training logs:</strong> workouts, sets, reps, weights, exercise notes,
            personal records, and calendar entries.
          </li>
          <li>
            <strong>Daily check-ins (health-related):</strong> sleep, energy, soreness, stress, and
            motivation ratings, plus pain ratings for the knee, shoulder, lower back, and ankle.
            This is wellness information about you, so we treat it as sensitive.
          </li>
          <li>
            <strong>Activity:</strong> when you were last active in the app.
          </li>
          <li>
            <strong>Pilot applications:</strong> if a coach applies for the founding team pilot, we
            store the name, email, team or club name, level, roster size, current tracking method,
            and any notes they type into the form. We use these only to reply to the application.
          </li>
        </ul>

        <h2>Cookies and tracking</h2>
        <p>
          We use cookies only to keep you signed in, and your browser stores which of your teams
          you last had open. We do not run advertising trackers or third-party analytics.
        </p>

        <h2>Who can see your data</h2>
        <ul>
          <li>
            <strong>You</strong> can see everything you&apos;ve logged.
          </li>
          <li>
            <strong>Your coach</strong>, if you joined their team, can view (read-only) your daily
            check-ins and stats history, workout completion, personal records, calendar entries,
            performance profile, and when you were last active. They cannot see your personal
            exercise notes or set-by-set entries, and they cannot edit or delete anything you
            logged. A coach only ever sees athletes on their own roster.
          </li>
          <li>
            <strong>Teammates and other teams</strong> cannot see your check-ins, stats, or logs.
          </li>
          <li>
            <strong>The people who run NextRep</strong> can technically access the database in
            order to run and support the service. We only do so for that purpose.
          </li>
          <li>
            <strong>Service providers.</strong> NextRep runs on Supabase (database and sign-in) and
            Vercel (hosting). They process data on our behalf to keep the service running.
          </li>
          <li>We don&apos;t sell your data or share it with anyone else.</li>
        </ul>

        <h2>Leaving a team, and deleting your data</h2>
        <ul>
          <li>
            <strong>Leave a team:</strong> an athlete can leave a team at any time, and that coach
            stops seeing your data straight away. A coach can also remove an athlete from their
            roster.
          </li>
          <li>
            <strong>Delete your account:</strong> there is no delete button in the app yet, so
            email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address on your
            account and ask. We will delete your account and the training, check-in, and profile
            data linked to it.
          </li>
          <li>
            <strong>Pilot applications:</strong> ask at the same address and we will delete your
            application.
          </li>
          <li>
            <strong>Parents and guardians</strong> can make the same request for an athlete under
            18.
          </li>
        </ul>

        <h2>How we protect it</h2>
        <p>
          Every table in the database has access rules that limit each account to its own data
          plus the coach view described above. No system is perfectly secure, so please use a
          strong, unique password and don&apos;t share your login or your team code outside your
          roster.
        </p>

        <h2>Health disclaimer</h2>
        <p>
          NextRep is a training-and-recovery tracking tool. It does not diagnose injuries,
          provide medical advice, or replace a doctor, athletic trainer, or physical therapist.
          If you&apos;re dealing with pain or a possible injury, talk to a medical professional.
          Don&apos;t rely on this app for that decision.
        </p>

        <h2>Athletes under 18</h2>
        <p>
          If you&apos;re a minor using NextRep as part of a team, a parent or guardian should be
          aware that you&apos;re logging training and recovery data, including soreness and pain
          check-ins, that your coach can view. Coaches who invite athletes under 18 are
          responsible for having any permission their school or club requires.
        </p>

        <h2>Changes</h2>
        <p>
          If we change what we collect or who can see it, we&apos;ll update this page and the
          date at the top.
        </p>

        <h2>Questions</h2>
        <p>
          Reach out any time at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
