import type { Metadata } from "next";

import { DemoExperience } from "@/components/demo/DemoExperience";

import "@/styles/coach.css";
import "@/styles/dashboard.css";
import "@/styles/demo.css";

export const metadata: Metadata = {
  title: "NextRep demo: sample coach dashboard",
  description:
    "Explore a sample volleyball team in NextRep with no login. See readiness, the Attention Center, roster history and the team program."
};

export default function DemoPage() {
  return <DemoExperience />;
}
