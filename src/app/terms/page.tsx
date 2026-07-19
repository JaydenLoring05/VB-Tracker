import { LandingHeader } from "@/components/landing/LandingHeader";
import { CONTACT_EMAIL } from "@/lib/contact";

import "@/styles/landing.css";
import "@/styles/legal.css";

export default function TermsPage() {
  return (
    <div className="legal-page">
      <LandingHeader />

      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated July 19, 2026.</p>

        <p>
          These are the plain-language terms for using ElevateOS during its pilot phase. By
          creating an account, you&apos;re agreeing to them.
        </p>

        <h2>Your account</h2>
        <p>
          You&apos;re responsible for the accuracy of what you log and for keeping your account
          credentials to yourself. Coaches are responsible for the teams they create and the
          invite codes they share.
        </p>

        <h2>Pricing</h2>
        <p>
          Your first 90-day pilot is free, no card required. After that, plans start at
          $29/month for teams up to 16 athletes and $49/month for 17+ athletes, paused
          automatically during the off-season.
        </p>

        <h2>Not medical advice</h2>
        <p>
          ElevateOS tracks training and recovery data. It does not diagnose injuries or provide
          medical advice, and it isn&apos;t a substitute for a doctor, athletic trainer, or
          physical therapist.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Use ElevateOS for its intended purpose — tracking your own or your team&apos;s training
          and recovery. Don&apos;t try to access another team&apos;s data, share invite codes
          outside your own roster, or use the service in a way that disrupts it for other teams.
        </p>

        <h2>No warranty</h2>
        <p>
          ElevateOS is provided as-is during this pilot phase. We work to keep it reliable, but
          we don&apos;t guarantee uninterrupted or error-free service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the product evolves, especially during the pilot. We&apos;ll
          post changes here.
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
