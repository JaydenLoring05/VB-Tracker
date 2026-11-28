"use client";

import { useState } from "react";

import { addFromProgramMessage, AddFromProgramResult, ProgramDayChoice } from "@/lib/customProgram";

/**
 * "Add from another program..." under a day in the plan builder (F-24). Adds
 * a day from another saved program to the end of this one, so a day can be
 * barbell lifts from one plan, then accessory work from another. It copies;
 * later edits to the other program don't follow.
 */
export function AddFromProgramSelect({
  dayName,
  choices,
  onAdd
}: {
  dayName: string;
  choices: ProgramDayChoice[];
  onAdd: (choice: ProgramDayChoice) => AddFromProgramResult;
}) {
  const [status, setStatus] = useState<string | null>(null);
  if (choices.length === 0) return null;

  const programs = [...new Map(choices.map((choice) => [choice.programId, choice.programName])).entries()];

  function handleChange(value: string) {
    const choice = choices.find((c) => choiceValue(c) === value);
    if (!choice) return;
    setStatus(addFromProgramMessage(choice, onAdd(choice), dayName));
  }

  return (
    <div className="custom-program-add-from">
      <select
        aria-label={`Add exercises to ${dayName} from another program`}
        value=""
        onChange={(event) => handleChange(event.target.value)}
      >
        <option value="">Add from another program...</option>
        {programs.map(([programId, programName]) => (
          <optgroup key={programId} label={programName}>
            {choices
              .filter((choice) => choice.programId === programId)
              .map((choice) => (
                <option key={choiceValue(choice)} value={choiceValue(choice)}>
                  {choiceLabel(choice)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {status && (
        <span className="muted" role="status">
          {status}
        </span>
      )}
    </div>
  );
}

function choiceValue(choice: ProgramDayChoice): string {
  return `${choice.programId}|${choice.day.day}`;
}

function choiceLabel(choice: ProgramDayChoice): string {
  const count = choice.day.exercises.filter((exercise) => exercise.name.trim() !== "").length;
  const title = choice.day.title.trim();
  return `${choice.day.day}${title ? `: ${title}` : ""} (${count} exercise${count === 1 ? "" : "s"})`;
}
