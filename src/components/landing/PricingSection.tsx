"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Billing = "monthly" | "annual";

const TIERS = [
  {
    name: "Up to 16 athletes",
    monthly: 29,
    annual: 290,
    features: [
      "Full roster recovery + activity view",
      "PRs and workout adherence per athlete",
      "Unlimited invite codes"
    ]
  },
  {
    name: "17+ athletes",
    monthly: 49,
    annual: 490,
    features: [
      "Everything in the 16-athlete tier",
      "No roster size limit",
      "Priority support"
    ]
  }
];

export function PricingSection() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section id="pricing" className="landing-section">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">Pricing</h2>
        <p className="landing-section-lead">
          Your first 90-day pilot is free, no card required. Afterward, plans start at
          $29/month for teams up to 16 athletes, $49/month for 17+, paused automatically
          during the off-season.
        </p>

        <div className="pricing-toggle" role="group" aria-label="Billing period">
          <button
            type="button"
            className={billing === "monthly" ? "" : "ghost"}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={billing === "annual" ? "" : "ghost"}
            onClick={() => setBilling("annual")}
          >
            Annual <span className="pricing-toggle-badge">2 months free</span>
          </button>
        </div>

        <div className="pricing-grid">
          {TIERS.map((tier) => (
            <div className="panel pricing-card" key={tier.name}>
              <h3>{tier.name}</h3>
              <div className="pricing-price">
                <span className="pricing-amount">
                  ${billing === "monthly" ? tier.monthly : tier.annual}
                </span>
                <span className="muted">/{billing === "monthly" ? "mo" : "yr"}</span>
              </div>

              <ul className="pricing-features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
              </ul>

              <Link href="/login?mode=sign-up">
                <button type="button" className="secondary">
                  Start a free pilot
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
