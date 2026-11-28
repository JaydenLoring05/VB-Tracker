import type { Metadata } from "next";

import { AthleteLanding } from "@/components/join/AthleteLanding";
import { ATHLETE_PLAN } from "@/lib/billing";
import { pageMetadata } from "@/lib/site";

import "@/styles/landing.css";
import "@/styles/pilot.css";
import "@/styles/dashboard.css";
import "@/styles/join.css";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Your personal volleyball strength coach",
    description: `Every volleyball player deserves a strength coach. A plan for your position, level and age that adjusts to practice, games and sore spots. ${ATHLETE_PLAN.priceLabel} with a ${ATHLETE_PLAN.trialDays}-day free trial.`,
    path: "/",
    shareTitle: "NextRep: every volleyball player deserves a strength coach",
    shareDescription: "Jump higher. Move faster. Get stronger. Your personal volleyball performance coach, in your pocket."
  }),
  // The layout's title is already the brand line; keep the home page from becoming "… | NextRep".
  title: { absolute: "NextRep: your personal volleyball strength coach" }
};

export default function HomePage() {
  return <AthleteLanding />;
}
