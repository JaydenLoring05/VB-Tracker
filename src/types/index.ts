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

export type FilmTagType = "kill" | "error" | "block" | "dig" | "ace" | "serve_error" | "set" | "note" | "pass";

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
};
