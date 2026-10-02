import type { CustomProgram, ProgramDay, ProgramExercise } from "@/lib/customProgram";

/**
 * Position-based starting programs: one repeating week per position group, in
 * the same shape the coach program builder saves (team_programs.days). An
 * athlete gets one from the position they pick at onboarding; a coach can
 * also start a team program from one.
 *
 * Three training days a week so they fit around team practice. Every
 * exercise is in src/data/exercises.ts (tests/data/positionPrograms.test.ts).
 */

export type StartingProgramKey = "outside_opposite" | "middle" | "setter" | "libero";

export type PositionProgram = {
  key: StartingProgramKey;
  label: string;
  /** Why this week looks the way it does, shown when picking a program. */
  focus: string;
  program: Omit<CustomProgram, "id">;
};

const reps = (name: string, sets: number, target: string): ProgramExercise => ({ name, sets, reps: target, seconds: null });
const hold = (name: string, sets: number, seconds: number): ProgramExercise => ({ name, sets, reps: null, seconds });

const training = (day: string, title: string, notes: string, exercises: ProgramExercise[]): ProgramDay => ({
  day,
  title,
  notes,
  minutes: "45-60",
  rest: false,
  exercises
});

const rest = (day: string): ProgramDay => ({ day, title: "Rest", notes: "", minutes: "", rest: true, exercises: [] });

const recovery = (day: string): ProgramDay => ({
  day,
  title: "Recovery",
  notes: "Optional. Easy movement only.",
  minutes: "15-20",
  rest: true,
  exercises: [hold("Full-Body Mobility Flow", 1, 600), hold("Foam Roll", 1, 300)]
});

function week(days: Partial<Record<string, ProgramDay>>): ProgramDay[] {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
    (day) => days[day] ?? (day === "Sunday" ? recovery(day) : rest(day))
  );
}

export const POSITION_PROGRAMS: Record<StartingProgramKey, PositionProgram> = {
  outside_opposite: {
    key: "outside_opposite",
    label: "Outside / Opposite",
    focus: "Approach jump, arm-swing power and the shoulder work that keeps a hitter's arm healthy.",
    program: {
      name: "Outside / Opposite starter",
      days: week({
        Monday: training("Monday", "Lower power", "Jumps first while fresh, then strength.", [
          reps("Approach Jumps", 4, "3"),
          reps("Trap Bar Deadlift or RDL", 4, "5"),
          reps("Bulgarian Split Squat", 3, "8"),
          reps("Nordic Hamstring Curl", 3, "5"),
          reps("Calf Raises", 3, "12"),
          reps("Pallof Press", 3, "10")
        ]),
        Wednesday: training("Wednesday", "Upper and shoulder", "Pull at least as much as you push.", [
          reps("Pull-Ups", 4, "5"),
          reps("Landmine Press or DB Shoulder Press", 3, "8"),
          reps("Single-Arm Row", 3, "10"),
          reps("Med Ball Rotational Throws", 3, "6"),
          reps("External Rotations", 3, "12"),
          reps("Face Pulls", 3, "15")
        ]),
        Friday: training("Friday", "Jump and speed", "Full rest between jumps; quality over volume.", [
          reps("Box Jumps", 4, "4"),
          reps("Broad Jumps", 3, "4"),
          reps("Front Squat", 4, "5"),
          reps("Hip Thrust", 3, "8"),
          hold("Side Planks", 3, 30)
        ])
      })
    }
  },
  middle: {
    key: "middle",
    label: "Middle",
    focus: "Vertical jump, quick lateral footwork along the net and landing control for a high jump count.",
    program: {
      name: "Middle starter",
      days: week({
        Monday: training("Monday", "Lower strength", "Heavy but crisp; leave a rep in the tank.", [
          reps("Front Squat", 4, "5"),
          reps("Romanian Deadlift", 3, "8"),
          reps("Step-Ups", 3, "8"),
          reps("Calf Raises", 4, "12"),
          reps("Dead Bugs", 3, "10")
        ]),
        Wednesday: training("Wednesday", "Plyos and lateral", "Blocking footwork: move, plant, jump.", [
          reps("Approach Jumps", 4, "3"),
          reps("Lateral Bounds", 3, "5"),
          reps("Depth Drops", 3, "4"),
          reps("Pogo Hops", 3, "20"),
          reps("Lateral Band Walks", 3, "12"),
          reps("Hip Thrust", 3, "8")
        ]),
        Friday: training("Friday", "Upper and core", "Strong hands and a stiff trunk at the net.", [
          reps("Pull-Ups", 4, "5"),
          reps("DB Bench Press", 3, "8"),
          reps("Face Pulls", 3, "15"),
          reps("Pallof Press", 3, "10"),
          hold("Planks", 3, 45),
          hold("Farmer Carries", 3, 40)
        ])
      })
    }
  },
  setter: {
    key: "setter",
    label: "Setter",
    focus: "Quick feet to the ball, single-leg balance, and wrist, shoulder and core control for clean hands.",
    program: {
      name: "Setter starter",
      days: week({
        Monday: training("Monday", "Lower and balance", "Single-leg work to stay square to the target.", [
          reps("Goblet Squat", 3, "10"),
          reps("Reverse Lunges", 3, "8"),
          reps("Single-Leg Balance Reach", 3, "8"),
          reps("Hamstring Curls", 3, "10"),
          reps("Tibialis Raises", 3, "15")
        ]),
        Wednesday: training("Wednesday", "Upper and shoulder", "Shoulder blades do the work, not the neck.", [
          reps("Push-Ups", 3, "12"),
          reps("Bodyweight Rows", 3, "10"),
          reps("Y-T-W Raises", 3, "8"),
          reps("External Rotations", 3, "12"),
          reps("Scap Push-Ups", 3, "10"),
          reps("Dead Bugs", 3, "10")
        ]),
        Friday: training("Friday", "Agility and jump", "Short, fast and fully rested.", [
          reps("Line Hops", 3, "20"),
          reps("Lateral Bounds", 3, "5"),
          reps("Box Jumps", 3, "4"),
          reps("Court Sprints", 4, "1"),
          hold("Side Planks", 3, 30),
          reps("Pallof Press", 3, "10")
        ])
      })
    }
  },
  libero: {
    key: "libero",
    label: "Libero / DS",
    focus: "First-step speed, strength in low defensive positions and knee health, with little jump volume.",
    program: {
      name: "Libero / DS starter",
      days: week({
        Monday: training("Monday", "Lower strength", "Own the low position: slow down, then drive up.", [
          reps("Goblet Squat", 3, "10"),
          reps("Bulgarian Split Squat", 3, "8"),
          reps("Romanian Deadlift", 3, "8"),
          hold("Spanish Squat", 3, 45),
          reps("Calf Raises", 3, "15")
        ]),
        Wednesday: training("Wednesday", "Speed and agility", "Every rep at full speed, full rest between.", [
          reps("Sprint Starts", 6, "1"),
          reps("Lateral Bounds", 3, "6"),
          reps("Pogo Hops", 3, "20"),
          reps("Lateral Band Walks", 3, "12"),
          reps("Patrick Step", 3, "12")
        ]),
        Friday: training("Friday", "Upper and core", "Arms that hold a platform; a trunk that stays still.", [
          reps("Push-Ups", 3, "12"),
          reps("Single-Arm Row", 3, "10"),
          reps("Band Pull-Aparts", 3, "15"),
          reps("Dead Bugs", 3, "10"),
          hold("Side Planks", 3, 30)
        ])
      })
    }
  }
};
