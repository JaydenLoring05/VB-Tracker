import type { Metadata } from "next";
import Link from "next/link";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { CONTACT_EMAIL } from "@/lib/contact";
import { pageMetadata } from "@/lib/site";

import "@/styles/landing.css";
import "@/styles/legal.css";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The plain-language terms for using NextRep during its founding team pilot: accounts, pricing, acceptable use, and what we do and do not promise.",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <div className="legal-page">
      <LandingHeader />

      <main id="main-content" tabIndex={-1} className="legal-content">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated September 23, 2026.</p>

        <p>
          These are the plain-language terms for using NextRep during its pilot phase. By
          creating an account, you&apos;re agreeing to them. How we handle your data is covered
          in the <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Your account</h2>
        <p>
          You&apos;re responsible for the accuracy of what you log and for keeping your account
          credentials to yourself. Coaches are responsible for the teams they create and the
          invite codes they share.
        </p>

        <h2>Founding team pilot</h2>
        <p>
          We&apos;re accepting a limited number of volleyball teams for a free 30-day founding
          pilot. Applying does not guarantee a place: we review each application and reply by
          email. Founding teams get direct setup help and early access to new features, and we
          ask for honest feedback in return.
        </p>

        <h2>Pricing</h2>
        <p>
          The pilot is free and no payment details are collected for it. After the pilot, plans
          start at $29/month for teams up to 16 athletes and $49/month for larger programs, as
          shown on our pricing section. Athletes never pay: they join through their coach&apos;s
          team code. We&apos;ll agree the next step with you before anything is charged.
        </p>

        <h2>Not medical advice</h2>
        <p>
          NextRep tracks training and recovery data. It does not diagnose injuries or provide
          medical advice, and it isn&apos;t a substitute for a doctor, athletic trainer, or
          physical therapist.
        </p>

        <h2>Coaches and athletes under 18</h2>
        <p>
          If you&apos;re a coach who invites athletes under 18, you&apos;re responsible for having
          any permission your school, club, or the athletes&apos; parents or guardians require
          before they join, because you&apos;ll be able to see their check-in and training data.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Use NextRep for its intended purpose: tracking your own or your team&apos;s training
          and recovery. Don&apos;t try to access another team&apos;s data, share invite codes
          outside your own roster, submit false or automated pilot applications, or use the
          service in a way that disrupts it for other teams.
        </p>

        <h2>Ending your use</h2>
        <p>
          You can stop using NextRep at any time, and you can ask us to delete your account by
          emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may suspend
          accounts that break these terms.
        </p>

        <h2>No warranty</h2>
        <p>
          NextRep is provided as-is during this pilot phase. We work to keep it reliable, but
          we don&apos;t guarantee uninterrupted or error-free service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the product evolves, especially during the pilot.
          We&apos;ll post changes here and update the date at the top.
        </p>

        <h2>Questions</h2>
        <p>
          Reach out any time at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </main>
    </div>
  );
}
