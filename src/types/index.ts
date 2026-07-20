export type ExerciseCategory =
  | "Jump Development"
  | "Landing Mechanics"
  | "Knee Strength"
  | "Shoulder Health"
  | "Hitting Power"
  | "Rotational Core"
  | "Speed & Agility"
  | "Volleyball Conditioning"
  | "Mobility"
  | "Recovery";

export type ExerciseLevel = "Beginner" | "Intermediate" | "Advanced";

export type Exercise = {
  name: string;
  category: ExerciseCategory;
  level: ExerciseLevel;
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
  energy: number | "";
  stress: number | "";
  soreness: number | "";
  kneePain: number | "";
  shoulderPain: number | "";
  lowerBackPain: number | "";
  anklePain: number | "";
  motivation: number | "";
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

export type TeamRole = "coach" | "athlete";

export type Team = {
  id: string;
  coach_id: string;
  name: string;
  invite_code: string;
  created_at: string;
  plan_tier: "pilot" | "paid";
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  display_name: string | null;
  joined_at: string;
};

export type RosterAthlete = {
  userId: string;
  displayName: string;
  joinedAt: string;
  recovery: number;
  recoveryLabel: string;
  lastCheckIn: string | null;
  needsCheckIn: boolean;
  lastActiveAt: string | null;
};
