import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDemoData, DEMO_TEAM_NAME, DEMO_WORKOUTS_PER_WEEK, type DemoData } from "@/data/demoData";
import { computeAttentionItems } from "@/lib/attentionCenter";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NOW = new Date("2026-07-20T15:00:00");

afterEach(() => {
  vi.useRealTimers();
});

describe("buildDemoData determinism", () => {
  it("returns identical output for the same day, call after call", () => {
    expect(buildDemoData(NOW)).toEqual(buildDemoData(new Date(NOW)));
    expect(buildDemoData(NOW)).toEqual(buildDemoData(NOW));
  });

  it("does not mutate the date it is given", () => {
    const now = new Date(NOW);
    buildDemoData(now);
    expect(now.getTime()).toBe(NOW.getTime());
  });

  it("keeps the same people and scripted values on every day", () => {
    const monday = buildDemoData(new Date("2026-07-20T09:00:00"));
    const thursday = buildDemoData(new Date("2026-07-23T09:00:00"));

    expect(thursday.athletes.map((athlete) => athlete.displayName)).toEqual(
      monday.athletes.map((athlete) => athlete.displayName)
    );
    expect(thursday.planCompletionPercent).toEqual(monday.planCompletionPercent);
  });
});

describe("buildDemoData shape", () => {
  const data = buildDemoData(NOW);
  const ids = data.athletes.map((athlete) => athlete.userId);

  it("describes a paid demo team", () => {
    expect(data.team).toMatchObject({ id: "demo-team", name: DEMO_TEAM_NAME, plan_tier: "paid" });
    expect(data.team.invite_code).toBeTruthy();
  });

  it("has a realistic roster with unique ids and names", () => {
    expect(ids.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(data.athletes.map((athlete) => athlete.displayName)).size).toBe(ids.length);
    expect(data.roster.map((athlete) => athlete.userId)).toEqual(ids);
  });

  it("has an entry for every athlete in every per-athlete record", () => {
    for (const record of [
      data.statsHistory,
      data.completedSessions,
      data.completedLast7,
      data.planCompletionPercent,
      data.prs,
      data.recentPRs
    ]) {
      expect(Object.keys(record).sort()).toEqual([...ids].sort());
    }
  });

  it("has no empty required fields on roster rows", () => {
    for (const athlete of data.roster) {
      expect(athlete.displayName).toBeTruthy();
      expect(athlete.recoveryLabel).toBeTruthy();
      expect(athlete.lastCheckIn).toBeTruthy();
      expect(athlete.lastActiveAt).toBeTruthy();
      expect(Number.isNaN(new Date(athlete.joinedAt).getTime())).toBe(false);
      expect(Number.isNaN(new Date(athlete.lastCheckIn as string).getTime())).toBe(false);
    }
  });

  it("keeps recovery scores in 0-100 and consistent with the check-in history", () => {
    for (const athlete of data.roster) {
      expect(athlete.recovery).toBeGreaterThanOrEqual(0);
      expect(athlete.recovery).toBeLessThanOrEqual(100);

      const history = data.statsHistory[athlete.userId];
      expect(athlete.recovery).toBe(calculateRecovery(history[history.length - 1]));
      expect(athlete.recoveryLabel).toBe(recoveryStatus(athlete.recovery).label);
    }
  });

  it("spans the whole range of readiness labels so the demo is not one color", () => {
    const labels = new Set(data.roster.map((athlete) => athlete.recoveryLabel));
    expect(labels.size).toBeGreaterThanOrEqual(3);
    expect(labels.has("Low")).toBe(true);
  });

  it("lists athlete fields in the DemoAthlete records", () => {
    for (const athlete of data.athletes) {
      expect(athlete.userId).toMatch(/^demo-/);
      expect(new Date(athlete.lastActiveAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
    }
  });
});

describe("buildDemoData stats history", () => {
  const data = buildDemoData(NOW);

  it("has valid ascending, unique ISO dates ending at or before today", () => {
    for (const [userId, history] of Object.entries(data.statsHistory)) {
      expect(history.length, userId).toBeGreaterThanOrEqual(8);
      const dates = history.map((entry) => entry.date);
      dates.forEach((date) => expect(date, userId).toMatch(ISO_DATE));
      expect(dates, userId).toEqual([...dates].sort());
      expect(new Set(dates).size, userId).toBe(dates.length);
      expect(new Date(`${dates[dates.length - 1]}T00:00:00`).getTime(), userId).toBeLessThanOrEqual(NOW.getTime());
    }
  });

  it("keeps every check-in value inside its valid range", () => {
    for (const [userId, history] of Object.entries(data.statsHistory)) {
      for (const entry of history) {
        const label = `${userId} ${entry.date}`;
        expect(entry.sleep, label).toBeGreaterThanOrEqual(4);
        expect(entry.sleep, label).toBeLessThanOrEqual(9);
        for (const key of ["energy", "stress", "soreness", "motivation"] as const) {
          expect(entry[key], `${label} ${key}`).toBeGreaterThanOrEqual(1);
          expect(entry[key], `${label} ${key}`).toBeLessThanOrEqual(10);
        }
        for (const key of ["kneePain", "shoulderPain", "lowerBackPain", "anklePain"] as const) {
          expect(entry[key], `${label} ${key}`).toBeGreaterThanOrEqual(0);
          expect(entry[key], `${label} ${key}`).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it("has numeric (never empty) values for every readiness field", () => {
    const fields = ["sleep", "energy", "stress", "soreness", "kneePain", "shoulderPain", "lowerBackPain", "anklePain", "motivation"] as const;
    for (const history of Object.values(data.statsHistory)) {
      for (const entry of history) {
        for (const field of fields) expect(typeof entry[field]).toBe("number");
      }
    }
  });

  it("records a rising vertical jump between the first and last check-in", () => {
    for (const [userId, history] of Object.entries(data.statsHistory)) {
      const first = history[0].vertical;
      const last = history[history.length - 1].vertical;
      expect(typeof first, userId).toBe("number");
      expect(typeof last, userId).toBe("number");
      expect(last as number, userId).toBeGreaterThan(first as number);
      expect(last as number, userId).toBeGreaterThan(15);
      expect(last as number, userId).toBeLessThan(40);
    }
  });
});

describe("buildDemoData workouts, PRs, calendar", () => {
  const data = buildDemoData(NOW);

  it("has completed sessions that are past, newest first, with sane durations", () => {
    for (const [userId, sessions] of Object.entries(data.completedSessions)) {
      expect(sessions.length, userId).toBeGreaterThan(0);
      const ended = sessions.map((session) => new Date(session.ended_at).getTime());
      expect(ended, userId).toEqual([...ended].sort((a, b) => b - a));
      expect(new Set(sessions.map((session) => session.id)).size, userId).toBe(sessions.length);

      for (const session of sessions) {
        expect(ended[0], userId).toBeLessThanOrEqual(NOW.getTime());
        expect(session.week).toBeGreaterThanOrEqual(1);
        expect(session.week).toBeLessThanOrEqual(20);
        expect(session.day).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/);
        expect(session.duration_seconds as number).toBeGreaterThanOrEqual(30 * 60);
        expect(session.duration_seconds as number).toBeLessThanOrEqual(90 * 60);
      }
    }
  });

  it("only schedules training on the documented weekdays", () => {
    expect(DEMO_WORKOUTS_PER_WEEK).toBe(4);
    for (const sessions of Object.values(data.completedSessions)) {
      for (const session of sessions) {
        expect(["Monday", "Wednesday", "Friday", "Saturday"]).toContain(session.day);
      }
    }
  });

  it("reports completedLast7 that matches the session list", () => {
    for (const [userId, sessions] of Object.entries(data.completedSessions)) {
      const recent = sessions.filter((session) => NOW.getTime() - new Date(session.ended_at).getTime() <= 7 * DAY_MS);
      expect(data.completedLast7[userId], userId).toBe(recent.length);
    }
  });

  it("keeps plan completion percentages in 0-100", () => {
    for (const percent of Object.values(data.planCompletionPercent)) {
      expect(percent).toBeGreaterThan(0);
      expect(percent).toBeLessThanOrEqual(100);
    }
  });

  it("has fully populated PRs with recent PRs a subset within 7 days", () => {
    for (const [userId, prs] of Object.entries(data.prs)) {
      expect(prs.length, userId).toBeGreaterThan(0);
      for (const pr of prs) {
        expect(pr.id).toBeTruthy();
        expect(pr.exercise).toBeTruthy();
        expect(pr.value).toBeTruthy();
        expect(pr.unit).toBeTruthy();
        expect(pr.date).toMatch(ISO_DATE);
        expect(typeof pr.note).toBe("string");
      }

      for (const recent of data.recentPRs[userId]) {
        expect(prs.some((pr) => pr.exercise === recent.exercise)).toBe(true);
        expect(NOW.getTime() - new Date(recent.date).getTime()).toBeLessThanOrEqual(7 * DAY_MS + DAY_MS / 2);
      }
    }
  });

  it("schedules upcoming team events with valid types and dates", () => {
    const types = ["practice", "match", "tournament", "travel", "testing", "playoffs"];
    expect(data.calendarEvents.length).toBeGreaterThanOrEqual(5);
    for (const event of data.calendarEvents) {
      expect(types).toContain(event.type);
      expect(event.title).toBeTruthy();
      expect(event.date).toMatch(ISO_DATE);
      expect(event.team_id).toBe(data.team.id);
    }
    expect(new Set(data.calendarEvents.map((event) => event.id)).size).toBe(data.calendarEvents.length);
    expect(data.calendarEvents.every((event) => new Date(`${event.date}T12:00:00`).getTime() > NOW.getTime() - DAY_MS)).toBe(true);
  });

  it("gives the spotlight athlete a valid week, checked exercises and streak", () => {
    expect(data.athletes.some((athlete) => athlete.userId === data.spotlight.userId)).toBe(true);
    expect(data.spotlight.week).toBeGreaterThanOrEqual(1);
    expect(data.spotlight.week).toBeLessThanOrEqual(20);
    expect(data.spotlight.workoutStreak).toBeGreaterThanOrEqual(0);
    for (const [key, value] of Object.entries(data.spotlight.checked)) {
      expect(key).toContain(`${data.spotlight.week}-`);
      expect(value).toBe(true);
    }
  });
});

// The demo exists to show the Attention Center working, so its storylines must
// hold on every day of the week, not just the day it was written.
describe("buildDemoData storylines through the real attention ranking", () => {
  function attentionFor(now: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const data: DemoData = buildDemoData(now);
    const items = computeAttentionItems(data.roster, data.statsHistory, data.completedLast7, data.recentPRs);
    vi.useRealTimers();
    return { data, items };
  }

  const week = Array.from({ length: 14 }, (_, offset) => new Date(new Date("2026-07-13T15:00:00").getTime() + offset * DAY_MS));

  it.each(week.map((day) => [day.toDateString(), day] as const))("shows a high, medium and positive item on %s", (_label, day) => {
    const { items } = attentionFor(day);
    const priorities = new Set(items.map((item) => item.priority));

    expect(priorities).toEqual(new Set(["high", "medium", "positive"]));
    expect(items[0].priority).toBe("high");
  });

  it.each(week.map((day) => [day.toDateString(), day] as const))("keeps the scripted athletes' storylines on %s", (_label, day) => {
    const { data, items } = attentionFor(day);
    const byUser = (id: string) => items.filter((item) => item.userId === id).map((item) => item.id);

    expect(byUser("demo-maya")).toContain("demo-maya-pain");
    expect(data.completedLast7["demo-sam"]).toBe(0);
    expect(byUser("demo-sam")).toContain("demo-sam-missed-workouts");
    expect(data.completedLast7["demo-kayla"]).toBe(1);
    expect(byUser("demo-ava")).toContain("demo-ava-new-pr");
    expect(data.roster.find((athlete) => athlete.userId === "demo-priya")?.needsCheckIn).toBe(true);
  });

  it.each(week.map((day) => [day.toDateString(), day] as const))("gives everyone else at least two workouts on %s", (_label, day) => {
    const { data } = attentionFor(day);
    const scripted = new Set(["demo-sam", "demo-kayla"]);
    for (const [userId, count] of Object.entries(data.completedLast7)) {
      if (!scripted.has(userId)) expect(count, userId).toBeGreaterThanOrEqual(2);
    }
  });
});
