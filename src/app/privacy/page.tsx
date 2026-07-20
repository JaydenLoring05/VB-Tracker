import { LandingHeader } from "@/components/landing/LandingHeader";
import { CONTACT_EMAIL } from "@/lib/contact";

import "@/styles/landing.css";
import "@/styles/legal.css";

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <LandingHeader />

      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated July 19, 2026.</p>

        <p>
          NextRep is a training and recovery tracker for volleyball teams. This page explains
          what we collect, who can see it, and how it&apos;s used, in plain language, because
          you shouldn&apos;t need a lawyer to understand it.
        </p>

        <h2>What we collect</h2>
        <p>
          When you use NextRep we store the account info you sign up with (email), the team
          you create or join, and the training data you choose to log: workouts, sets and reps,
          soreness and pain ratings, sleep and energy check-ins, personal records, and calendar
          entries.
        </p>

        <h2>Who can see your data</h2>
        <ul>
          <li>
            <strong>Athletes</strong> own their own data. You can always see everything you&apos;ve
            logged.
          </li>
          <li>
            <strong>Coaches</strong> can see read-only recovery and training data for athletes on
            their own roster, never any other team&apos;s. Coaches cannot edit or delete an
            athlete&apos;s logged data.
          </li>
          <li>We don&apos;t sell or share your data with any third party.</li>
        </ul>

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
          aware that you&apos;re logging training and recovery data (including soreness and pain
          check-ins) that your coach can view.
        </p>

        <h2>Questions</h2>
        <p>
          Reach out any time at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
