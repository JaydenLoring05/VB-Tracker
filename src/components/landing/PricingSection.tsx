import { Check } from "lucide-react";
import Link from "next/link";

const TIERS = [
  {
    name: "Founding Pilot",
    price: "Free",
    period: "for 30 days",
    highlight: true,
    features: [
      "For our first 3 founding volleyball teams",
      "No credit card required",
      "Full access to all core features",
      "Direct setup assistance from the founder"
    ],
    cta: "Apply for Founding Team Access"
  },
  {
    name: "Team",
    price: "$29",
    period: "/month",
    features: ["Up to 16 athletes", "Full roster recovery and readiness view", "All core features"],
    cta: "Start Free Team Pilot"
  },
  {
    name: "Program",
    price: "$49",
    period: "/month",
    features: ["Unlimited athletes", "Multiple training groups", "Priority support"],
    cta: "Start Free Team Pilot"
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="landing-section">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">Pricing</h2>
        <p className="landing-section-lead">
          Free for the first 30 days for each of our first 3 founding teams, no credit card
          required. After that (or for any team beyond the first 3), plans start at $29/month.
          NextRep is a year-round training tool, so there's no seasonal billing pause.
        </p>

        <div className="pricing-grid pricing-grid-3">
          {TIERS.map((tier) => (
            <div className={`panel pricing-card ${tier.highlight ? "pricing-card-highlight" : ""}`} key={tier.name}>
              <h3>{tier.name}</h3>
              <div className="pricing-price">
                <span className="pricing-amount">{tier.price}</span>
                <span className="muted">{tier.period}</span>
              </div>

              <ul className="pricing-features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
              </ul>

              <Link href="/pilot">
                <button type="button" className={tier.highlight ? "" : "secondary"}>
                  {tier.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
