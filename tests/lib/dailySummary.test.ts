import { describe, expect, it, vi } from "vitest";

import {
  buildTeamSummary,
  isAuthorizedCronRequest,
  localDateIn,
  readDailySummaryConfig,
  renderSummaryEmail,
  sendSummaryEmail,
  type DailySummaryTeamData
} from "@/lib/dailySummary";

const NOW = new Date("2026-10-01T13:00:00Z"); // 6am in Los Angeles, a Thursday
const TODAY = "2026-10-01";

function statsRow(date: string, overrides: Record<string, number | null> = {}) {
  return {
    date,
    created_at: `${date}T14:00:00Z`,
    updated_at: `${date}T14:00:00Z`,
    vertical: null,
    approach: null,
    weight: null,
    pullups: null,
    sleep: 9,
    energy: 10,
    stress: 0,
    soreness: 0,
    knee_pain: 0,
    shoulder_pain: 0,
    lower_back_pain: 0,
    ankle_pain: 0,
    motivation: 10,
    ...overrides
  };
}

function team(overrides: Partial<DailySummaryTeamData> = {}): DailySummaryTeamData {
  return {
    team_id: "t1",
    team_name: "Varsity <Girls>",
    coach_email: "coach@example.com",
    coach_name: "Coach Kim",
    team_program_days: null,
    today_events: [],
    athletes: [
      {
        user_id: "a",
        display_name: "Ava",
        latest_stats: statsRow("2026-10-01"),
        stats_history: [statsRow("2026-09-30"), statsRow("2026-10-01")],
        completed_last7: 3,
        recent_prs: []
      },
      {
        user_id: "b",
        display_name: "Maya",
        latest_stats: { ...statsRow("2026-09-30", { knee_pain: 6 }), updated_at: "2026-09-30T14:00:00Z" },
        stats_history: [statsRow("2026-09-30", { knee_pain: 6 })],
        completed_last7: 0,
        recent_prs: []
      },
      {
        user_id: "c",
        display_name: "Jordan",
        latest_stats: null,
        stats_history: [],
        completed_last7: 2,
        recent_prs: []
      }
    ],
    ...overrides
  };
}

describe("readDailySummaryConfig", () => {
  const env = {
    RESEND_API_KEY: "re_123",
    DAILY_SUMMARY_FROM: "NextRep <summary@example.com>",
    CRON_SECRET: "s3cret"
  };

  it("is null (feature off) unless every required variable is set", () => {
    expect(readDailySummaryConfig({})).toBeNull();
    expect(readDailySummaryConfig({ ...env, RESEND_API_KEY: "" })).toBeNull();
    expect(readDailySummaryConfig({ ...env, DAILY_SUMMARY_FROM: undefined })).toBeNull();
    expect(readDailySummaryConfig({ ...env, CRON_SECRET: " " })).toBeNull();
  });

  it("defaults the time zone to Los Angeles", () => {
    expect(readDailySummaryConfig(env)).toEqual({
      resendApiKey: "re_123",
      from: "NextRep <summary@example.com>",
      cronSecret: "s3cret",
      timeZone: "America/Los_Angeles"
    });
    expect(readDailySummaryConfig({ ...env, DAILY_SUMMARY_TIME_ZONE: "America/Chicago" })?.timeZone).toBe(
      "America/Chicago"
    );
  });
});

describe("isAuthorizedCronRequest", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isAuthorizedCronRequest("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorizedCronRequest("Bearer wrong", "s3cret")).toBe(false);
    expect(isAuthorizedCronRequest("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedCronRequest(null, "s3cret")).toBe(false);
  });
});

describe("localDateIn", () => {
  it("uses the coach's time zone, not UTC", () => {
    const lateEvening = new Date("2026-10-02T03:00:00Z"); // Oct 1, 8pm in LA
    expect(localDateIn("America/Los_Angeles", lateEvening)).toBe("2026-10-01");
    expect(localDateIn("UTC", lateEvening)).toBe("2026-10-02");
  });
});

describe("buildTeamSummary", () => {
  it("matches the in-app team summary numbers", () => {
    const summary = buildTeamSummary(team(), NOW, TODAY);
    expect(summary.rosterSize).toBe(3);
    expect(summary.checkedIn).toBe(2); // Jordan has never checked in
    expect(summary.readiness).not.toBeNull();
  });

  it("counts athletes needing attention once each", () => {
    // Maya: no workouts this week. Jordan: never checked in.
    expect(buildTeamSummary(team(), NOW, TODAY).attentionCount).toBe(2);
  });

  it("lists pain alerts from recent check-ins at the attention threshold", () => {
    expect(buildTeamSummary(team(), NOW, TODAY).painAlerts).toEqual([{ name: "Maya", parts: ["knee"] }]);
  });

  it("ignores pain on check-ins older than yesterday", () => {
    const old = team();
    old.athletes[1].latest_stats = { ...statsRow("2026-09-25", { knee_pain: 9 }), updated_at: "2026-09-25T14:00:00Z" };
    expect(buildTeamSummary(old, NOW, TODAY).painAlerts).toEqual([]);
  });

  it("describes today's team-program workout", () => {
    const withProgram = team({
      team_program_days: [
        { day: "Thursday", title: "Lower power", rest: false, exercises: [{ name: "Box Jumps" }, { name: "RDL" }] }
      ]
    });
    expect(buildTeamSummary(withProgram, NOW, TODAY).todayWorkout).toBe("Lower power (2 exercises)");
  });

  it("calls out a rest day on the team program", () => {
    const rest = team({ team_program_days: [{ day: "Thursday", title: "Rest", rest: true, exercises: [] }] });
    expect(buildTeamSummary(rest, NOW, TODAY).todayWorkout).toBe("Rest day");
  });

  it("falls back to individual plans when there is no team program", () => {
    expect(buildTeamSummary(team(), NOW, TODAY).todayWorkout).toBeNull();
  });
});

describe("renderSummaryEmail", () => {
  it("escapes names in the HTML and includes every number", () => {
    const summary = buildTeamSummary(team({ today_events: [{ type: "match", title: "vs <Central>" }] }), NOW, TODAY);
    const email = renderSummaryEmail(summary, "https://nextrep.example");
    expect(email.subject).toBe("Varsity <Girls>: 2/3 checked in, 2 need attention");
    expect(email.html).toContain("Varsity &lt;Girls&gt;");
    expect(email.html).toContain("vs &lt;Central&gt;");
    expect(email.html).not.toContain("<Girls>");
    expect(email.html).toContain("https://nextrep.example/coach");
    expect(email.text).toContain("Checked in: 2 of 3");
    expect(email.text).toContain("Pain alerts: Maya (knee)");
    expect(email.text).toContain("Today's workout: each athlete's own plan");
  });
});

describe("sendSummaryEmail", () => {
  const config = { resendApiKey: "re_123", from: "NextRep <s@example.com>", cronSecret: "x", timeZone: "UTC" };
  const message = { to: "coach@example.com", subject: "S", html: "<p>H</p>", text: "T" };

  it("posts to Resend with the API key", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    await expect(sendSummaryEmail(fetchFn, config, message)).resolves.toBe(true);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_123");
    expect(JSON.parse(init.body)).toEqual({
      from: "NextRep <s@example.com>",
      to: ["coach@example.com"],
      subject: "S",
      html: "<p>H</p>",
      text: "T"
    });
  });

  it("reports failure without throwing", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("bad", { status: 422 }));
    await expect(sendSummaryEmail(fetchFn, config, message)).resolves.toBe(false);
    const failing = vi.fn().mockRejectedValue(new Error("network"));
    await expect(sendSummaryEmail(failing, config, message)).resolves.toBe(false);
  });
});
