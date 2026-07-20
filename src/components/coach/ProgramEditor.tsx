"use client";

import { Team } from "@/types";

export function ProgramEditor({ team }: { team: Team }) {
  return (
    <div className="panel">
      <p className="muted">Program editor for {team.name} coming soon.</p>
    </div>
  );
}
