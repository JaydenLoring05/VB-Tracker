import type { Metadata } from "next";

import { DemoExperience } from "@/components/demo/DemoExperience";

import "@/styles/coach.css";
import "@/styles/dashboard.css";
import "@/styles/demo.css";
import "@/styles/film.css";
import "@/styles/workout-mode.css";

export const metadata: Metadata = {
  title: "NextRep demo: sample coach dashboard",
  description:
    "Explore a sample volleyball team in NextRep with no login. See readiness, the Attention Center, roster history, the team program, Workout Mode and the film room."
};

export default function DemoPage() {
  return <DemoExperience />;
}
