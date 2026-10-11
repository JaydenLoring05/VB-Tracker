import { useState } from "react";

import { ExerciseSuggestions, SectionEditor } from "@/components/coach/ProgramSectionEditor";
import {
  CustomProgram,
  dayExercises,
  ImportedPlan,
  parseProgramText,
  ProgramDay,
  ProgramExercise,
  programFromImport,
  WEEKDAYS,
  type Weekday
} from "@/lib/customProgram";

const EXAMPLE = `Monday
Back squat 3x8
RDL - 4 x 8-10
Plank 3x30 sec

Wednesday
Bench press 3x8
Abs:
Dead bug 3x10`;

/**
 * Bring in a plan the coach already has: paste it, read it, check and fix
 * the preview, then open it in the builder. Nothing is saved or added until
 * the coach presses "Use this plan", and even then it's an unsaved program.
 */
export function ProgramImport({
  remembered,
  onUse,
  onCancel
}: {
  /** The coach's own exercises, offered in the name boxes. */
  remembered: ProgramExercise[];
  onUse: (program: Omit<CustomProgram, "id">) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<ImportedPlan | null>(null);
  const [name, setName] = useState("My program");
  const [nothingFound, setNothingFound] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);

  function read(source: string) {
    const found = parseProgramText(source);
    setNothingFound(found.days.length === 0);
    setPlan(found.days.length > 0 ? found : null);
  }

  if (!plan) {
    return (
      <div className="custom-program-import">
        <p className="muted">
          Paste your plan from a doc, a note or an email. One exercise per line, like &quot;Back squat 3x8&quot;. Put
          a day name on its own line to start that day. You&apos;ll check everything before it&apos;s added.
        </p>
        <textarea
          aria-label="Your plan"
          placeholder={EXAMPLE}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        {nothingFound && (
          <p className="program-guardrail-warning" role="alert">
            No exercises found. Put one exercise on each line, like &quot;Back squat 3x8&quot;.
          </p>
        )}
        <div className="custom-program-import-actions">
          <button type="button" onClick={() => read(text)} disabled={!text.trim()}>
            Read my plan
          </button>
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const exerciseCount = plan.days.reduce((count, day) => count + dayExercises(day).length, 0);
  const missingReps = plan.days.reduce(
    (count, day) => count + dayExercises(day).filter((e) => e.seconds == null && !e.reps?.trim()).length,
    0
  );

  function updateDay(index: number, next: ProgramDay) {
    setPlan((current) => current && { ...current, days: current.days.map((day, i) => (i === index ? next : day)) });
  }

  /** Moves a day to another weekday. If that weekday is taken, the two days swap. */
  function moveDay(index: number, weekday: Weekday) {
    setPlan((current) => {
      if (!current) return current;
      const from = current.days[index].day as Weekday;
      const days = current.days
        .map((day, i) => (i === index ? { ...day, day: weekday } : day.day === weekday ? { ...day, day: from } : day))
        .sort((a, b) => WEEKDAYS.indexOf(a.day as Weekday) - WEEKDAYS.indexOf(b.day as Weekday));
      const notes = { ...current.notes, [weekday]: current.notes[from], [from]: current.notes[weekday] };
      return { ...current, days, notes };
    });
  }

  function removeDay(index: number) {
    setPlan((current) => current && { ...current, days: current.days.filter((_, i) => i !== index) });
  }

  return (
    <div className="custom-program-import">
      <ExerciseSuggestions remembered={remembered} typing={typing} />

      <label className="custom-program-name">
        <span className="micro">Program name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <p className="muted" role="status">
        Found {plan.days.length} day{plan.days.length === 1 ? "" : "s"} and {exerciseCount} exercise
        {exerciseCount === 1 ? "" : "s"}. Check them and fix anything that came in wrong.
        {missingReps > 0 &&
          ` ${missingReps} exercise${missingReps === 1 ? " has" : "s have"} no reps yet; ${
            missingReps === 1 ? "it's" : "they're"
          } marked.`}
      </p>

      {plan.leftOut.length > 0 && (
        <div className="program-guardrail-warning">
          <p>Not brought in:</p>
          <ul>
            {plan.leftOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.days.map((day, index) => {
        const notes = Object.entries(plan.notes[day.day as Weekday] ?? {});
        const showNames = day.sections.length > 1 || day.sections.some((section) => section.name.trim() !== "");
        // Athletes see the first unnamed list as "Main" (see programToWorkoutDays).
        const mainIndex = day.sections.findIndex((section) => section.name.trim() === "");
        return (
          <div key={day.day} className="panel custom-program-day">
            <div className="custom-program-import-day-header">
              <select
                aria-label={`Weekday for ${day.day}`}
                value={day.day}
                onChange={(event) => moveDay(index, event.target.value as Weekday)}
              >
                {WEEKDAYS.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {weekday}
                  </option>
                ))}
              </select>
              <input
                aria-label={`${day.day} name`}
                placeholder="Day name"
                value={day.title}
                onChange={(event) => updateDay(index, { ...day, title: event.target.value })}
              />
              <button
                type="button"
                className="ghost danger-button"
                onClick={() => removeDay(index)}
                aria-label={`Leave out ${day.day}`}
              >
                Leave out
              </button>
            </div>

            {day.sections.map((section, sectionIndex) => (
              <SectionEditor
                key={sectionIndex}
                section={section}
                dayName={day.day}
                showName={showNames}
                namePlaceholder={sectionIndex === mainIndex ? "Main" : undefined}
                remembered={remembered}
                onTyping={setTyping}
                onChange={(next) =>
                  updateDay(index, { ...day, sections: day.sections.map((s, i) => (i === sectionIndex ? next : s)) })
                }
                onRemove={
                  day.sections.length > 1
                    ? () => updateDay(index, { ...day, sections: day.sections.filter((_, i) => i !== sectionIndex) })
                    : undefined
                }
              />
            ))}

            {notes.length > 0 && (
              <div className="muted">
                <p className="micro">Notes, added to the day&apos;s notes</p>
                <ul>
                  {notes.map(([exercise, note]) => (
                    <li key={exercise}>
                      {exercise}: {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      <div className="custom-program-import-actions">
        <button
          type="button"
          onClick={() => onUse(programFromImport({ ...plan, days: plan.days }, name))}
          disabled={plan.days.length === 0}
        >
          Use this plan
        </button>
        <button type="button" className="ghost" onClick={() => setPlan(null)}>
          Back
        </button>
      </div>
      <p className="muted">It opens in the builder. Nothing is saved until you save it there.</p>
    </div>
  );
}
