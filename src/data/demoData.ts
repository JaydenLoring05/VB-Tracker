import type { PRRecord } from "@/context/TrackerContext";
import { getWorkoutDays } from "@/data/workoutPlan";
import type { CompletedSession } from "@/hooks/useAthleteAdherence";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";
import { todayISO } from "@/lib/storage";
import type {
  FilmTag,
  RosterAthlete,
  StatEntry,
  Team,
  TeamCalendarEvent,
  TeamCalendarEventType,
  TeamFilm
} from "@/types";

/**
 * Static, deterministic sample data for the public /demo experience.
 *
 * Every date is an offset from the `now` handed to buildDemoData(), so the
 * demo always looks current, while everything else (names, scores, streaks,
 * PRs) comes from a fixed-seed generator and never changes between visits.
 * Nothing here touches the network or the database.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const SEASON_WEEK = 14;
const HISTORY_DAYS = 14;
const SESSION_HISTORY_DAYS = 98;
const TRAINING_WEEKDAYS = [1, 3, 5, 6];
export const DEMO_WORKOUTS_PER_WEEK = TRAINING_WEEKDAYS.length;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DEMO_TEAM_NAME = "Varsity Girls";

export type DemoAthlete = {
  userId: string;
  displayName: string;
  joinedAt: string;
  lastActiveAt: string;
};

export type DemoSpotlight = {
  userId: string;
  week: number;
  checked: Record<string, boolean>;
  workoutStreak: number;
};

export type DemoPreviousSet = { weight: number | null; reps: number | null; seconds: number | null };

/** The session the demo's Workout Mode opens on, and Ava's last numbers for each exercise. */
export type DemoWorkout = {
  week: number;
  day: string;
  previousSets: Record<string, DemoPreviousSet>;
};

export type DemoData = {
  team: Team;
  athletes: DemoAthlete[];
  roster: RosterAthlete[];
  statsHistory: Record<string, StatEntry[]>;
  completedSessions: Record<string, CompletedSession[]>;
  completedLast7: Record<string, number>;
  planCompletionPercent: Record<string, number>;
  prs: Record<string, PRRecord[]>;
  recentPRs: Record<string, { exercise: string; date: string }[]>;
  calendarEvents: TeamCalendarEvent[];
  spotlight: DemoSpotlight;
  films: TeamFilm[];
  filmTags: FilmTag[];
  workout: DemoWorkout;
};

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/* ------------------------------------------------------------------ */
/* Athlete blueprints                                                  */
/* ------------------------------------------------------------------ */

type Vitals = { sleep: number; energy: number; stress: number; soreness: number; motivation: number };
type PainLevels = { knee: number; shoulder: number; lowerBack: number; ankle: number };
type MutableStats = StatEntry;

type PRBlueprint = { exercise: string; value: string; unit: string; daysAgo: number; note?: string };

type Blueprint = {
  key: string;
  name: string;
  vitals: Vitals;
  pain?: Partial<PainLevels>;
  /** Chance of attending each scheduled workout. */
  reliability: number;
  /** Latest vertical jump in inches, and how far it has climbed since preseason. */
  vertical: number;
  verticalGain: number;
  planPercent: number;
  lastActiveHoursAgo: number;
  joinedDaysAgo: number;
  /** Days since the last check-in. Omit for "checked in today". */
  lastCheckInDaysAgo?: number;
  /** Cap on completed workouts in the last 7 days (the "missed workouts" storyline). */
  maxWorkoutsLast7?: number;
  /** Scripted storyline overrides, applied after the generated values. daysAgo 0 is today. */
  script?: (entry: MutableStats, daysAgo: number) => void;
  prs: PRBlueprint[];
};

const BLUEPRINTS: Blueprint[] = [
  {
    key: "ava",
    name: "Ava Thompson",
    vitals: { sleep: 8.5, energy: 9, stress: 2, soreness: 2, motivation: 9 },
    reliability: 0.97,
    vertical: 25.5,
    verticalGain: 2.5,
    planPercent: 72,
    lastActiveHoursAgo: 2,
    joinedDaysAgo: 118,
    prs: [
      { exercise: "Vertical Jump", value: "25.5", unit: "in", daysAgo: 2, note: "Testing day PR, up 2.5 in since preseason" },
      { exercise: "Approach Jump", value: "31", unit: "in", daysAgo: 2 },
      { exercise: "Back Squat", value: "135", unit: "lb", daysAgo: 24 },
      { exercise: "Trap Bar Deadlift", value: "185", unit: "lb", daysAgo: 38 }
    ]
  },
  {
    key: "maya",
    name: "Maya Chen",
    vitals: { sleep: 7.5, energy: 7, stress: 4, soreness: 4, motivation: 8 },
    reliability: 0.9,
    vertical: 22,
    verticalGain: 1,
    planPercent: 63,
    lastActiveHoursAgo: 5,
    joinedDaysAgo: 118,
    script: (entry, daysAgo) => {
      if (daysAgo === 2) entry.kneePain = 5;
      else if (daysAgo === 1) entry.kneePain = 6;
      else if (daysAgo === 0) entry.kneePain = 5;
      else if (daysAgo <= 6) entry.kneePain = 2;
    },
    prs: [
      { exercise: "Vertical Jump", value: "22", unit: "in", daysAgo: 16 },
      { exercise: "Back Squat", value: "125", unit: "lb", daysAgo: 30 }
    ]
  },
  {
    key: "jordan",
    name: "Jordan Park",
    vitals: { sleep: 8.5, energy: 9, stress: 2, soreness: 2, motivation: 9 },
    reliability: 0.88,
    vertical: 23,
    verticalGain: 1.5,
    planPercent: 66,
    lastActiveHoursAgo: 9,
    joinedDaysAgo: 118,
    script: (entry, daysAgo) => {
      if (daysAgo <= 7) {
        entry.sleep = clamp(Number(entry.sleep) - 3, 4, 9);
        entry.energy = clamp(Number(entry.energy) - 4, 1, 10);
        entry.stress = clamp(Number(entry.stress) + 5, 1, 10);
        entry.soreness = clamp(Number(entry.soreness) + 4, 1, 10);
        entry.motivation = clamp(Number(entry.motivation) - 4, 1, 10);
      }
    },
    prs: [
      { exercise: "Vertical Jump", value: "23", unit: "in", daysAgo: 20 },
      { exercise: "Approach Jump", value: "28", unit: "in", daysAgo: 20 },
      { exercise: "Back Squat", value: "130", unit: "lb", daysAgo: 45 }
    ]
  },
  {
    key: "sam",
    name: "Sam Rivera",
    vitals: { sleep: 7, energy: 6.5, stress: 5, soreness: 4, motivation: 6 },
    reliability: 0.82,
    maxWorkoutsLast7: 0,
    vertical: 20.5,
    verticalGain: 0.5,
    planPercent: 51,
    lastActiveHoursAgo: 60,
    joinedDaysAgo: 96,
    prs: [{ exercise: "Vertical Jump", value: "20.5", unit: "in", daysAgo: 26 }]
  },
  {
    key: "emma",
    name: "Emma Rodriguez",
    vitals: { sleep: 8, energy: 8, stress: 3, soreness: 3, motivation: 8 },
    reliability: 0.94,
    vertical: 24,
    verticalGain: 2,
    planPercent: 68,
    lastActiveHoursAgo: 3,
    joinedDaysAgo: 118,
    prs: [
      { exercise: "Vertical Jump", value: "24", unit: "in", daysAgo: 12 },
      { exercise: "Broad Jump", value: "96", unit: "in", daysAgo: 12 },
      { exercise: "Back Squat", value: "140", unit: "lb", daysAgo: 33 }
    ]
  },
  {
    key: "kayla",
    name: "Kayla Brooks",
    vitals: { sleep: 7, energy: 7, stress: 4, soreness: 4, motivation: 7 },
    reliability: 0.8,
    maxWorkoutsLast7: 1,
    vertical: 21,
    verticalGain: 1,
    planPercent: 55,
    lastActiveHoursAgo: 20,
    joinedDaysAgo: 96,
    prs: [{ exercise: "Vertical Jump", value: "21", unit: "in", daysAgo: 22 }]
  },
  {
    key: "lily",
    name: "Lily Nguyen",
    vitals: { sleep: 8.5, energy: 8.5, stress: 3, soreness: 3, motivation: 8.5 },
    reliability: 0.95,
    vertical: 26,
    verticalGain: 2,
    planPercent: 70,
    lastActiveHoursAgo: 1,
    joinedDaysAgo: 118,
    prs: [
      { exercise: "Vertical Jump", value: "26", unit: "in", daysAgo: 15 },
      { exercise: "Approach Jump", value: "32", unit: "in", daysAgo: 15 },
      { exercise: "Trap Bar Deadlift", value: "195", unit: "lb", daysAgo: 28 }
    ]
  },
  {
    key: "harper",
    name: "Harper Davis",
    vitals: { sleep: 6, energy: 6, stress: 6, soreness: 6, motivation: 6 },
    pain: { shoulder: 2 },
    reliability: 0.86,
    vertical: 20,
    verticalGain: 1,
    planPercent: 58,
    lastActiveHoursAgo: 7,
    joinedDaysAgo: 96,
    prs: [
      { exercise: "Vertical Jump", value: "20", unit: "in", daysAgo: 19 },
      { exercise: "Back Squat", value: "110", unit: "lb", daysAgo: 35 }
    ]
  },
  {
    key: "sofia",
    name: "Sofia Martinez",
    vitals: { sleep: 8, energy: 8, stress: 4, soreness: 3, motivation: 8 },
    reliability: 0.92,
    vertical: 23.5,
    verticalGain: 1.5,
    planPercent: 64,
    lastActiveHoursAgo: 4,
    joinedDaysAgo: 118,
    prs: [
      { exercise: "Back Squat", value: "145", unit: "lb", daysAgo: 3, note: "Five pounds over her old best" },
      { exercise: "Vertical Jump", value: "23.5", unit: "in", daysAgo: 14 }
    ]
  },
  {
    key: "chloe",
    name: "Chloe Johnson",
    vitals: { sleep: 7.5, energy: 7.5, stress: 4, soreness: 4, motivation: 7.5 },
    reliability: 0.9,
    vertical: 22.5,
    verticalGain: 1.5,
    planPercent: 62,
    lastActiveHoursAgo: 12,
    joinedDaysAgo: 118,
    prs: [
      { exercise: "Vertical Jump", value: "22.5", unit: "in", daysAgo: 18 },
      { exercise: "Broad Jump", value: "90", unit: "in", daysAgo: 18 }
    ]
  },
  {
    key: "zoe",
    name: "Zoe Williams",
    vitals: { sleep: 4.5, energy: 4, stress: 9, soreness: 8, motivation: 3 },
    pain: { lowerBack: 2, ankle: 3 },
    reliability: 0.84,
    vertical: 21.5,
    verticalGain: 0.5,
    planPercent: 54,
    lastActiveHoursAgo: 26,
    joinedDaysAgo: 96,
    prs: [{ exercise: "Vertical Jump", value: "21.5", unit: "in", daysAgo: 21 }]
  },
  {
    key: "priya",
    name: "Priya Patel",
    vitals: { sleep: 7.5, energy: 7, stress: 4, soreness: 4, motivation: 7 },
    reliability: 0.88,
    vertical: 22.5,
    verticalGain: 1,
    planPercent: 60,
    lastActiveHoursAgo: 96,
    lastCheckInDaysAgo: 4,
    joinedDaysAgo: 96,
    prs: [
      { exercise: "Vertical Jump", value: "22.5", unit: "in", daysAgo: 23 },
      { exercise: "Back Squat", value: "120", unit: "lb", daysAgo: 40 }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

function daysAgoDate(anchor: Date, daysAgo: number) {
  const date = new Date(anchor);
  date.setDate(anchor.getDate() - daysAgo);
  return date;
}

function mondayOf(date: Date) {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function buildStatsHistory(blueprint: Blueprint, anchor: Date, rng: () => number): StatEntry[] {
  const entries: StatEntry[] = [];
  const newestDay = blueprint.lastCheckInDaysAgo ?? 0;
  const pain: PainLevels = { knee: 0.6, shoulder: 0.5, lowerBack: 0.5, ankle: 0.5, ...blueprint.pain };

  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= newestDay; daysAgo--) {
    const roll = rng();
    // A couple of missed check-ins keep the history believable, but the
    // recent days a storyline depends on are never skipped.
    if (daysAgo > newestDay + 3 && roll < 0.08) continue;

    const noise = () => rng() * 2 - 1;
    const painNoise = () => Math.round(clamp(noise() * 1.2, -1, 1));

    const entry: MutableStats = {
      date: todayISO(daysAgoDate(anchor, daysAgo)),
      vertical: "",
      approach: "",
      weight: "",
      pullups: "",
      sleep: clamp(roundTo(blueprint.vitals.sleep + noise() * 0.8, 0.5), 4, 9),
      energy: clamp(Math.round(blueprint.vitals.energy + noise()), 1, 10),
      stress: clamp(Math.round(blueprint.vitals.stress + noise()), 1, 10),
      soreness: clamp(Math.round(blueprint.vitals.soreness + noise()), 1, 10),
      kneePain: clamp(Math.round(pain.knee) + painNoise(), 0, 3),
      shoulderPain: clamp(Math.round(pain.shoulder) + painNoise(), 0, 3),
      lowerBackPain: clamp(Math.round(pain.lowerBack) + painNoise(), 0, 3),
      anklePain: clamp(Math.round(pain.ankle) + painNoise(), 0, 3),
      motivation: clamp(Math.round(blueprint.vitals.motivation + noise()), 1, 10)
    };

    blueprint.script?.(entry, daysAgo);
    entries.push(entry);
  }

  // Preseason baseline on the first check-in and today's testing result on the last.
  const first = entries[0];
  const last = entries[entries.length - 1];
  const baseline = blueprint.vertical - blueprint.verticalGain;
  first.vertical = baseline;
  first.approach = baseline + 6;
  last.vertical = blueprint.vertical;
  last.approach = blueprint.vertical + 6;

  return entries;
}

function buildSessions(blueprint: Blueprint, anchor: Date, rng: () => number): CompletedSession[] {
  const sessions: CompletedSession[] = [];
  const thisMonday = mondayOf(anchor).getTime();
  let last7 = 0;

  function addSession(daysAgo: number) {
    const date = daysAgoDate(anchor, daysAgo);
    const endedAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 30 + Math.floor(rng() * 50));
    const weeksAgo = Math.round((thisMonday - mondayOf(date).getTime()) / (7 * DAY_MS));

    sessions.push({
      id: `${blueprint.key}-session-${daysAgo}`,
      week: Math.max(1, SEASON_WEEK - weeksAgo),
      day: WEEKDAY_NAMES[date.getDay()],
      ended_at: endedAt.toISOString(),
      duration_seconds: (48 + Math.floor(rng() * 26)) * 60
    });
    if (daysAgo <= 7) last7++;
  }

  const maxLast7 = blueprint.maxWorkoutsLast7 ?? Infinity;
  const scheduled: number[] = [];

  for (let daysAgo = 1; daysAgo <= SESSION_HISTORY_DAYS; daysAgo++) {
    if (!TRAINING_WEEKDAYS.includes(daysAgoDate(anchor, daysAgo).getDay())) continue;
    scheduled.push(daysAgo);
    if (rng() < blueprint.reliability && (daysAgo > 7 || last7 < maxLast7)) addSession(daysAgo);
  }

  // Anyone without a "missed workouts" storyline still trained at least twice this week.
  if (blueprint.maxWorkoutsLast7 === undefined) {
    for (const daysAgo of scheduled) {
      if (last7 >= 2) break;
      if (daysAgo <= 7 && !sessions.some((session) => session.id.endsWith(`-${daysAgo}`))) addSession(daysAgo);
    }
  }

  // Kayla's single workout this week is guaranteed rather than left to chance.
  if (blueprint.maxWorkoutsLast7 === 1 && last7 === 0) {
    const daysAgo = scheduled.find((candidate) => candidate <= 7);
    if (daysAgo !== undefined) addSession(daysAgo);
  }

  return sessions.sort((a, b) => b.ended_at.localeCompare(a.ended_at));
}

function buildPRs(blueprint: Blueprint, anchor: Date) {
  const prs: PRRecord[] = blueprint.prs.map((pr, index) => ({
    id: `${blueprint.key}-pr-${index}`,
    date: todayISO(daysAgoDate(anchor, pr.daysAgo)),
    exercise: pr.exercise,
    value: pr.value,
    unit: pr.unit,
    note: pr.note ?? ""
  }));

  const recent = blueprint.prs
    .filter((pr) => pr.daysAgo <= 7)
    .map((pr) => ({
      exercise: pr.exercise,
      date: daysAgoDate(anchor, pr.daysAgo).toISOString()
    }));

  return { prs, recent };
}

function buildCalendar(teamId: string, anchor: Date): TeamCalendarEvent[] {
  const schedule: { inDays: number; type: TeamCalendarEventType; title: string; notes?: string }[] = [
    { inDays: 1, type: "practice", title: "Practice: serve receive and transition", notes: "3:30 PM, main gym" },
    { inDays: 2, type: "testing", title: "Vertical and approach jump testing", notes: "Record everyone's numbers in NextRep" },
    { inDays: 3, type: "match", title: "Home match vs. Central High", notes: "6:00 PM, JV at 4:30" },
    { inDays: 5, type: "practice", title: "Practice: defensive systems" },
    { inDays: 7, type: "travel", title: "Bus leaves for Riverside Invitational", notes: "2:00 PM from the south lot" },
    { inDays: 8, type: "tournament", title: "Riverside Invitational, day 1" },
    { inDays: 9, type: "tournament", title: "Riverside Invitational, day 2" },
    { inDays: 12, type: "match", title: "Conference match at Eastview" }
  ];

  return schedule.map((event, index) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() + event.inDays);

    return {
      id: `demo-event-${index}`,
      team_id: teamId,
      date: todayISO(date),
      type: event.type,
      title: event.title,
      notes: event.notes ?? null,
      created_by: "demo-coach",
      created_at: anchor.toISOString()
    };
  });
}

/* ------------------------------------------------------------------ */
/* Film room                                                           */
/* ------------------------------------------------------------------ */

// Public highlight reels from Volleyball World's official YouTube channel,
// checked to allow embedding. The tags below are sample tags on our demo
// roster, so they show how tagging works rather than describe these plays.
const DEMO_FILMS: { id: string; title: string; videoId: string; daysAgo: number }[] = [
  { id: "demo-film-1", title: "Film study: CHN vs. TUR, VNL final highlights", videoId: "t3MFjt2U9SY", daysAgo: 2 },
  { id: "demo-film-2", title: "Film study: ITA vs. BRA, VNL final highlights", videoId: "H37Lfp_Tm64", daysAgo: 9 }
];

type ScriptedTag = Partial<Omit<FilmTag, "id" | "film_id" | "team_id" | "created_by" | "created_at">> &
  Pick<FilmTag, "seconds" | "tag">;

const NO_DETAILS = {
  athlete_id: null,
  pass_rating: null,
  set_zone: null,
  set_type: null,
  block_outcome: null,
  attack_direction: null,
  note: null
} as const;

const DEMO_TAG_SCRIPT: Record<string, ScriptedTag[]> = {
  "demo-film-1": [
    { seconds: 18, tag: "pass", athlete_id: "demo-chloe", pass_rating: 3 },
    { seconds: 21, tag: "set", athlete_id: "demo-maya", set_zone: "4", set_type: "4" },
    { seconds: 24, tag: "kill", athlete_id: "demo-ava", attack_direction: "cross" },
    { seconds: 47, tag: "ace", athlete_id: "demo-jordan", attack_direction: "line" },
    { seconds: 71, tag: "pass", athlete_id: "demo-sofia", pass_rating: 1 },
    { seconds: 74, tag: "set", athlete_id: "demo-maya", set_zone: "3", set_type: "quick" },
    { seconds: 76, tag: "block", athlete_id: "demo-emma", block_outcome: "touch" },
    { seconds: 79, tag: "dig", athlete_id: "demo-chloe" },
    { seconds: 103, tag: "kill", athlete_id: "demo-kayla", attack_direction: "seam" },
    { seconds: 131, tag: "block", athlete_id: "demo-emma", block_outcome: "stuff" },
    { seconds: 158, tag: "serve_error", athlete_id: "demo-lily" },
    { seconds: 186, tag: "pass", athlete_id: "demo-chloe", pass_rating: 2 },
    { seconds: 189, tag: "set", athlete_id: "demo-maya", set_zone: "6", set_type: "pipe" },
    { seconds: 192, tag: "error", athlete_id: "demo-harper", attack_direction: "line" },
    { seconds: 214, tag: "note", note: "Transition is slow after the dig. Talk about it Monday." }
  ],
  "demo-film-2": [
    { seconds: 15, tag: "pass", athlete_id: "demo-sofia", pass_rating: 2 },
    { seconds: 19, tag: "kill", athlete_id: "demo-ava", attack_direction: "tip" },
    { seconds: 52, tag: "block", athlete_id: "demo-zoe", block_outcome: "tooled" },
    { seconds: 88, tag: "dig", athlete_id: "demo-chloe" },
    { seconds: 91, tag: "kill", athlete_id: "demo-kayla", attack_direction: "cross" },
    { seconds: 140, tag: "note", note: "Great example of a high ball swing to copy." }
  ]
};

function buildFilms(teamId: string, anchor: Date): { films: TeamFilm[]; filmTags: FilmTag[] } {
  const films = DEMO_FILMS.map((film) => ({
    id: film.id,
    team_id: teamId,
    event_id: null,
    title: film.title,
    video_url: `https://www.youtube.com/watch?v=${film.videoId}`,
    created_by: "demo-coach",
    created_at: daysAgoDate(anchor, film.daysAgo).toISOString()
  }));

  const filmTags = films.flatMap((film) =>
    (DEMO_TAG_SCRIPT[film.id] ?? []).map((tag, index) => ({
      ...NO_DETAILS,
      ...tag,
      id: `${film.id}-tag-${index}`,
      film_id: film.id,
      team_id: teamId,
      created_by: "demo-coach",
      created_at: film.created_at
    }))
  );

  return { films, filmTags };
}

/* ------------------------------------------------------------------ */
/* Workout Mode                                                        */
/* ------------------------------------------------------------------ */

// Workout Mode in the demo always opens on week 14's Monday lower-body
// session: it has weighted lifts, a timed hold and bodyweight reps, so it
// shows every kind of set. These are Ava's numbers from last week.
const DEMO_WORKOUT_DAY = "Monday";
const DEMO_PREVIOUS_SETS: Record<string, DemoPreviousSet> = {
  "Trap Bar Deadlift or RDL": { weight: 155, reps: 5, seconds: null },
  "Bulgarian Split Squat": { weight: 30, reps: 8, seconds: null },
  "Front Squat": { weight: 95, reps: 5, seconds: null },
  "Spanish Squat": { weight: null, reps: null, seconds: 40 },
  "Nordic Hamstring Curl": { weight: null, reps: 5, seconds: null },
  "Tibialis Raises": { weight: null, reps: 15, seconds: null }
};

function buildDemoWorkout(): DemoWorkout {
  return { week: SEASON_WEEK, day: DEMO_WORKOUT_DAY, previousSets: { ...DEMO_PREVIOUS_SETS } };
}

function buildSpotlight(userId: string, sessions: CompletedSession[], anchor: Date): DemoSpotlight {
  const thisMonday = mondayOf(anchor).getTime();
  const checked: Record<string, boolean> = {};

  // Mark every exercise on the days Ava already trained this week.
  const weekDays = getWorkoutDays(SEASON_WEEK);
  sessions
    .filter((session) => new Date(session.ended_at).getTime() >= thisMonday)
    .forEach((session) => {
      weekDays
        .find((day) => day.day === session.day)
        ?.exercises.forEach((exercise) => {
          checked[`${SEASON_WEEK}-${session.day}-${exercise}`] = true;
        });
    });

  // Streak counts back from yesterday, the same way the real tracker does.
  const trainedDays = new Set(sessions.map((session) => todayISO(new Date(session.ended_at))));
  let workoutStreak = 0;
  for (let daysAgo = 1; trainedDays.has(todayISO(daysAgoDate(anchor, daysAgo))); daysAgo++) workoutStreak++;

  return { userId, week: SEASON_WEEK, checked, workoutStreak };
}

/**
 * Builds the full sample dataset. Deterministic for a given `now`: the same
 * day always yields the same demo, with dates expressed relative to today.
 */
export function buildDemoData(now: Date = new Date()): DemoData {
  const anchor = new Date(now);
  anchor.setHours(12, 0, 0, 0);
  const rng = mulberry32(20260720);

  const team: Team = {
    id: "demo-team",
    coach_id: "demo-coach",
    name: DEMO_TEAM_NAME,
    invite_code: "NR-DEMO",
    created_at: daysAgoDate(anchor, 120).toISOString(),
    plan_tier: "paid"
  };

  const athletes: DemoAthlete[] = [];
  const roster: RosterAthlete[] = [];
  const statsHistory: DemoData["statsHistory"] = {};
  const completedSessions: DemoData["completedSessions"] = {};
  const completedLast7: DemoData["completedLast7"] = {};
  const planCompletionPercent: DemoData["planCompletionPercent"] = {};
  const prs: DemoData["prs"] = {};
  const recentPRs: DemoData["recentPRs"] = {};

  BLUEPRINTS.forEach((blueprint) => {
    const userId = `demo-${blueprint.key}`;
    const history = buildStatsHistory(blueprint, anchor, rng);
    const sessions = buildSessions(blueprint, anchor, rng);
    const { prs: athletePRs, recent } = buildPRs(blueprint, anchor);

    const lastActiveAt = new Date(now.getTime() - blueprint.lastActiveHoursAgo * 60 * 60 * 1000).toISOString();
    const joinedAt = daysAgoDate(anchor, blueprint.joinedDaysAgo).toISOString();
    const latest = history[history.length - 1];
    const lastCheckIn = new Date(`${latest.date}T08:00:00`);
    const recovery = calculateRecovery(latest);

    athletes.push({ userId, displayName: blueprint.name, joinedAt, lastActiveAt });
    roster.push({
      userId,
      displayName: blueprint.name,
      joinedAt,
      recovery,
      recoveryLabel: recoveryStatus(recovery).label,
      lastCheckIn: lastCheckIn.toISOString(),
      needsCheckIn: (now.getTime() - lastCheckIn.getTime()) / DAY_MS >= 3,
      lastActiveAt
    });
    statsHistory[userId] = history;
    completedSessions[userId] = sessions;
    completedLast7[userId] = sessions.filter((session) => now.getTime() - new Date(session.ended_at).getTime() <= 7 * DAY_MS).length;
    planCompletionPercent[userId] = blueprint.planPercent;
    prs[userId] = athletePRs;
    recentPRs[userId] = recent;
  });

  return {
    team,
    athletes,
    roster,
    statsHistory,
    completedSessions,
    completedLast7,
    planCompletionPercent,
    prs,
    recentPRs,
    calendarEvents: buildCalendar(team.id, anchor),
    spotlight: buildSpotlight("demo-ava", completedSessions["demo-ava"], anchor),
    ...buildFilms(team.id, anchor),
    workout: buildDemoWorkout()
  };
}
