import type { Metadata } from "next";

import { AthleteLanding } from "@/components/join/AthleteLanding";
import { pageMetadata } from "@/lib/site";

import "@/styles/landing.css";
import "@/styles/pilot.css";
import "@/styles/dashboard.css";
import "@/styles/join.css";

// /join is the same page as / (P-01). It stays so shared links like
// /join?ref=CODE keep working; search engines are pointed at /.
export const metadata: Metadata = pageMetadata({
  title: "Your personal volleyball strength coach",
  description:
    "Every volleyball player deserves a strength coach. A plan for your position, level and age that adjusts to practice, games and sore spots.",
  path: "/",
  shareTitle: "NextRep: every volleyball player deserves a strength coach",
  shareDescription: "Jump higher. Move faster. Get stronger. Your personal volleyball performance coach, in your pocket."
});

export default function JoinPage() {
  return <AthleteLanding />;
}
