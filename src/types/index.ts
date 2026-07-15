export type ExerciseCategory =
  | "Lower Body"
  | "Upper Body"
  | "Plyometrics"
  | "Core"
  | "Mobility"
  | "Rehab";

export type Exercise = {
  name: string;
  category: ExerciseCategory;
  icon: string;
  purpose: string;
  cues: string[];
  mistakes: string[];
  substitutions: string[];
  video: string;
};

export type WorkoutDay = {
  day: string;
  title: string;
  minutes: string;
  notes: string;
  rest?: boolean;
  exercises: string[];
};

export type StatEntry = {
  date: string;
  vertical: number | "";
  approach: number | "";
  weight: number | "";
  pullups: number | "";
  sleep: number | "";
  kneePain: number | "";
  shoulderPain: number | "";
  soreness: number | "";
  energy: number | "";
};

export type CalendarEvent = {
  id: string;
  date: string;
  type: "workout" | "practice" | "game" | "recovery" | "rest";
  title: string;
  notes?: string;
};

export type WorkoutSession = {
  id: string;
  week: number;
  day: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  created_at: string;
};
