"use client";

import { Target } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

const DEFAULT_GOALS = [
  "40+ inch vertical",
  "11'6 approach touch",
  "20 pull-ups",
  "No knee pain",
  "Stronger shoulder rotation",
  "Faster approach and arm swing"
];

export function TrainingGoals() {
  const { loading, profile } = useProfile();
  const goals = profile?.training_goals?.length ? profile.training_goals : DEFAULT_GOALS;

  return (
    <div className="panel">
      <h2>
        <Target size={22} /> Training Goals
      </h2>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        goals.map((goal) => <p key={goal}>&#9633; {goal}</p>)
      )}
    </div>
  );
}
