"use client";

import { useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { POSITION_PROGRAMS, type StartingProgramKey } from "@/data/positionPrograms";

const RECOMMENDED = "recommended";

/** Lets an athlete switch between the recommended plan and a position starting program. */
export function StartingProgramPicker() {
  const { startingProgram, setStartingProgram } = useTrackerContext();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function choose(value: string) {
    setSaving(true);
    setFailed(false);
    const ok = await setStartingProgram(value === RECOMMENDED ? null : (value as StartingProgramKey));
    setSaving(false);
    setFailed(!ok);
  }

  return (
    <label className="starting-program-picker">
      <span className="muted">Program</span>
      <select value={startingProgram ?? RECOMMENDED} onChange={(e) => choose(e.target.value)} disabled={saving}>
        <option value={RECOMMENDED}>Recommended 20-week plan</option>
        {Object.values(POSITION_PROGRAMS).map((template) => (
          <option key={template.key} value={template.key}>
            {template.label} starter
          </option>
        ))}
      </select>
      {failed && <span className="muted"> Couldn&apos;t save that. Try again.</span>}
    </label>
  );
}
