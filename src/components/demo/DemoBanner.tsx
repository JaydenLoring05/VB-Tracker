import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/shared/Brand";

/**
 * Persistent header for every demo screen: always says the data is sample
 * data, always offers the pilot CTA, and always offers a way back home.
 */
export function DemoBanner({ onStartTour }: { onStartTour: () => void }) {
  return (
    <header className="demo-banner">
      <div className="demo-banner-inner">
        <Link href="/" className="demo-banner-back" aria-label="Back to the NextRep home page">
          <ArrowLeft size={18} aria-hidden="true" />
          <BrandMark size={26} />
          <span className="demo-banner-back-label">NextRep</span>
        </Link>

        <p className="demo-banner-label">
          <span className="demo-sample-chip">Sample data</span>
          <span className="demo-banner-note">Varsity Girls demo. Nothing here is saved.</span>
        </p>

        <div className="demo-banner-actions">
          <button type="button" className="ghost demo-tour-button" onClick={onStartTour} aria-label="Take the guided tour">
            <Compass size={16} aria-hidden="true" />
            <span>Tour</span>
          </button>

          {/* Only one of the two spans is displayed (CSS), so the name always matches what is on screen. */}
          <Link href="/login?mode=sign-up" className="demo-cta">
            <span className="demo-cta-long">Start Free Team Pilot</span>
            <span className="demo-cta-short">Start Free Pilot</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
