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
  /** Coach-set targets per exercise ("3x8", "3x45 sec"). Only on coach-built programs. */
  targets?: Record<string, string>;
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

export type TeamCalendarEventType = "practice" | "match" | "tournament" | "travel" | "testing" | "playoffs";

export type TeamCalendarEvent = {
  id: string;
  team_id: string;
  date: string;
  type: TeamCalendarEventType;
  title: string;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type WorkoutSession = {
  id: string;
  week: number;
  day: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  active_seconds: number;
  resumed_at: string | null;
  rpe: number | null;
};

export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  /** Set duration for timed exercises (planks, holds). Null for rep-based sets. */
  seconds?: number | null;
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
  /** Athlete check-in reminder emails (schema_v50). Missing before that SQL runs. */
  checkin_reminder_enabled?: boolean;
  checkin_reminder_hour?: number;
  checkin_reminder_time_zone?: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  display_name: string | null;
  joined_at: string;
};

export type FilmTagType =
  | "kill"
  | "error"
  | "block"
  | "dig"
  | "ace"
  | "serve_error"
  | "set"
  | "note"
  | "pass"
  | "serve"
  | "attack";

/** The result of a three-tap tag (schema_v53). Which values apply depends on the skill. */
export type FilmResult =
  | "ace"
  | "in"
  | "error"
  | "3"
  | "2"
  | "1"
  | "0"
  | "good"
  | "ok"
  | "kill"
  | "in_play"
  | "stuff"
  | "touch"
  | "up";

export type PassRating = 0 | 1 | 2 | 3;
export type SetZone = "1" | "2" | "3" | "4" | "5" | "6";
export type SetType = "4" | "5" | "slide" | "pipe" | "back_row" | "quick" | "dump";
export type BlockOutcome = "stuff" | "touch" | "tooled" | "missed";
export type AttackDirection = "line" | "cross" | "seam" | "tip" | "roll";

/** The optional "who made the play and how good was it" fields from schema_v36. */
export type FilmTagDetails = {
  athlete_id: string | null;
  pass_rating: PassRating | null;
  set_zone: SetZone | null;
  set_type: SetType | null;
  block_outcome: BlockOutcome | null;
  attack_direction: AttackDirection | null;
};

export type TeamFilm = {
  id: string;
  team_id: string;
  event_id: string | null;
  title: string;
  video_url: string;
  created_by: string;
  created_at: string;
};

export type FilmTag = {
  id: string;
  film_id: string;
  team_id: string;
  seconds: number;
  tag: FilmTagType;
  note: string | null;
  /** Set by the three-tap flow; absent on older tags and before schema_v53 runs. */
  result?: FilmResult | null;
  created_by: string;
  created_at: string;
} & FilmTagDetails;

export type RosterAthlete = {
  userId: string;
  displayName: string;
  joinedAt: string;
  recovery: number;
  recoveryLabel: string;
  lastCheckIn: string | null;
  needsCheckIn: boolean;
  lastActiveAt: string | null;
  /** Hasn't answered the 18+ question, or is under 18 without guardian info (schema_v52). */
  guardianInfoMissing?: boolean;
};
