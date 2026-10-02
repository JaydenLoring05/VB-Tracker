import { describe, expect, it } from "vitest";

import { getExercise } from "@/data/exercises";
import { POSITION_PROGRAMS } from "@/data/positionPrograms";
import { WEEKDAYS, validateProgram } from "@/lib/customProgram";
import { getExerciseMeasure } from "@/lib/exerciseMeasure";

describe("position starting programs", () => {
  it("has the four position templates", () => {
    expect(Object.keys(POSITION_PROGRAMS).sort()).toEqual(["libero", "middle", "outside_opposite", "setter"]);
  });

  for (const [key, template] of Object.entries(POSITION_PROGRAMS)) {
    describe(key, () => {
      it("passes the coach program builder's own validation", () => {
        expect(validateProgram(template.program)).toEqual([]);
      });

      it("lists each weekday exactly once", () => {
        expect(template.program.days.map((day) => day.day)).toEqual([...WEEKDAYS]);
      });

      it("trains 3 or 4 days and rests the others", () => {
        const training = template.program.days.filter((day) => !day.rest).length;
        expect(training).toBeGreaterThanOrEqual(3);
        expect(training).toBeLessThanOrEqual(4);
      });

      it("only uses exercises from the library, timed ones with seconds and rep ones with reps", () => {
        for (const day of template.program.days) {
          for (const exercise of day.exercises) {
            expect(getExercise(exercise.name), `${key} ${day.day} ${exercise.name}`).toBeDefined();
            const timed = getExerciseMeasure(exercise.name) === "time";
            expect(exercise.seconds != null, `${exercise.name} timed`).toBe(timed);
            expect(exercise.reps != null, `${exercise.name} reps`).toBe(!timed);
          }
        }
      });
    });
  }
});
