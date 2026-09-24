import { describe, expect, it } from "vitest";

import {
  calculateRecovery,
  coachRecommendations,
  explainReadiness,
  recoveryStatus,
  severePainBodyParts
} from "@/lib/recovery";
import type { StatEntry } from "@/types";

/** A perfect check-in: scores exactly 100. */
const best: StatEntry = {
  date: "2026-07-20",
  vertical: "",
  approach: "",
  weight: "",
  pullups: "",
  sleep: 9,
  energy: 10,
  stress: 0,
  soreness: 0,
  kneePain: 0,
  shoulderPain: 0,
  lowerBackPain: 0,
  anklePain: 0,
  motivation: 10
};

const entry = (overrides: Partial<StatEntry> = {}): StatEntry => ({ ...best, ...overrides });

describe("calculateRecovery", () => {
  it("returns 0 when there is no check-in", () => {
    expect(calculateRecovery(null)).toBe(0);
    expect(calculateRecovery(undefined)).toBe(0);
  });

  it("scores a perfect check-in at 100 and the worst possible one at 0", () => {
    expect(calculateRecovery(best)).toBe(100);
    expect(
      calculateRecovery(
        entry({
          sleep: 0,
          energy: 0,
          stress: 10,
          soreness: 10,
          kneePain: 10,
          shoulderPain: 10,
          lowerBackPain: 10,
          anklePain: 10,
          motivation: 0
        })
      )
    ).toBe(0);
  });

  it("clamps out-of-range input into 0-100", () => {
    expect(calculateRecovery(entry({ sleep: 14 }))).toBe(100);
    expect(calculateRecovery(entry({ sleep: 0, energy: 0, motivation: 0, stress: 30, soreness: 30 }))).toBe(0);
  });

  it("weights each factor as documented", () => {
    // Each point of stress, soreness, knee, shoulder and lower-back pain costs 1;
    // ankle pain costs 0.5; sleep is out of 9 hours worth 20.
    expect(calculateRecovery(entry({ stress: 5 }))).toBe(95);
    expect(calculateRecovery(entry({ soreness: 10 }))).toBe(90);
    expect(calculateRecovery(entry({ kneePain: 4 }))).toBe(96);
    expect(calculateRecovery(entry({ anklePain: 10 }))).toBe(95);
    expect(calculateRecovery(entry({ sleep: 4.5 }))).toBe(90);
    expect(calculateRecovery(entry({ energy: 0 }))).toBe(85);
    expect(calculateRecovery(entry({ motivation: 0 }))).toBe(90);
  });

  it("rounds to a whole number", () => {
    expect(Number.isInteger(calculateRecovery(entry({ sleep: 7.3, energy: 6 })))).toBe(true);
  });

  it("treats non-numeric values as zero without producing NaN", () => {
    const score = calculateRecovery(entry({ sleep: "abc" as unknown as number }));
    expect(Number.isNaN(score)).toBe(false);
  });
});

describe("recoveryStatus thresholds", () => {
  it.each([
    [100, "Elite"],
    [85, "Elite"],
    [84, "Good"],
    [70, "Good"],
    [69, "Caution"],
    [55, "Caution"],
    [54, "Low"],
    [0, "Low"]
  ])("score %i is %s", (score, label) => {
    expect(recoveryStatus(score).label).toBe(label);
    expect(recoveryStatus(score).message).toBeTruthy();
  });
});

describe("severePainBodyParts", () => {
  const severe = (overrides: Partial<StatEntry> = {}) => entry({ kneePain: 8, ...overrides });

  it("needs at least 3 check-ins", () => {
    expect(severePainBodyParts([])).toEqual([]);
    expect(severePainBodyParts([severe(), severe()])).toEqual([]);
  });

  it("flags a body part at 8+ on each of the last 3 check-ins", () => {
    expect(severePainBodyParts([severe(), severe(), severe()])).toEqual(["knee"]);
    expect(severePainBodyParts([severe({ kneePain: 10 }), severe(), severe({ kneePain: 9 })])).toEqual(["knee"]);
  });

  it("does not flag when any of the last 3 is below 8, or when only older entries were severe", () => {
    expect(severePainBodyParts([severe(), severe({ kneePain: 7 }), severe()])).toEqual([]);
    expect(severePainBodyParts([severe(), severe(), severe(), entry()])).toEqual([]);
  });

  it("lists several body parts in a stable order", () => {
    const multi = severe({ anklePain: 9, shoulderPain: 8 });
    expect(severePainBodyParts([multi, multi, multi])).toEqual(["knee", "shoulder", "ankle"]);
  });
});

describe("coachRecommendations", () => {
  it("asks for stats when there is no check-in", () => {
    expect(coachRecommendations(null)).toHaveLength(1);
  });

  it("gives a green light for a healthy check-in", () => {
    expect(coachRecommendations(best)).toEqual(["✅ You are good to train today."]);
  });

  it("adds targeted advice for pain at 5 or above", () => {
    const list = coachRecommendations(entry({ kneePain: 5, lowerBackPain: 6 })).join("\n");
    expect(list).toContain("knee rehab");
    expect(list).toContain("spinal flexion");
    expect(list).not.toContain("shoulder");
  });

  it("flags low sleep, low energy, high stress, soreness and low motivation", () => {
    const list = coachRecommendations(
      entry({ sleep: 5, energy: 4, stress: 8, soreness: 8, motivation: 2 })
    ).join("\n");
    expect(list).toContain("8+ hours of sleep");
    expect(list).toContain("moderate");
    expect(list).toContain("extra warm-up");
    expect(list).toContain("Mobility and easy work only");
    expect(list).toContain("Low motivation");
    expect(list).toContain("Reduce total volume");
  });

  it("replaces all advice with a medical redirect when pain is severe and persistent", () => {
    const history = [1, 2, 3].map(() => entry({ shoulderPain: 9 }));
    const result = coachRecommendations(history[2], history);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("shoulder pain");
    expect(result[0]).toContain("medical professional");
    expect(result[0]).not.toContain("Replace overhead pressing");
  });
});

describe("explainReadiness", () => {
  it("asks for a check-in when there are no stats", () => {
    expect(explainReadiness(null, [], 0)).toContain("Log today's check-in");
  });

  it("says everything is normal when no factor is below normal", () => {
    const text = explainReadiness(best, [best], calculateRecovery(best));
    expect(text).toContain("Readiness: 100 · Elite");
    expect(text).toContain("normal range");
  });

  it("names a single weak factor with 'is'", () => {
    const stats = entry({ sleep: 5 });
    const text = explainReadiness(stats, [stats], calculateRecovery(stats));
    expect(text).toContain("Your sleep is below normal.");
  });

  it("names the two weakest factors, worst first, with 'are'", () => {
    // sleep 4.5/9 = 0.5, energy 0.6 (both below 0.7), motivation 0.65 is third weakest and dropped.
    const stats = entry({ sleep: 4.5, energy: 6, motivation: 6.5 });
    const text = explainReadiness(stats, [stats], calculateRecovery(stats));
    expect(text).toContain("Your sleep and energy are below normal.");
    expect(text).not.toContain("motivation");
  });

  it("treats exactly 70% of a factor as normal", () => {
    const stats = entry({ energy: 7 });
    expect(explainReadiness(stats, [stats], calculateRecovery(stats))).toContain("normal range");
  });

  it("short-circuits to a medical redirect on severe persistent pain", () => {
    const history = [1, 2, 3].map(() => entry({ lowerBackPain: 8, kneePain: 8 }));
    const text = explainReadiness(history[2], history, 40);

    expect(text).toContain("knee and lower back pain");
    expect(text).toContain("medical professional");
    expect(text).not.toContain("Readiness:");
  });
});
