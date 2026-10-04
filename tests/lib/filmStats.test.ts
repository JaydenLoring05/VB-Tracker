import { describe, expect, it } from "vitest";

import { buildQuickTag } from "@/lib/filmQuickTag";
import {
  blockOutcomes,
  filmStatsForAthlete,
  formatPassAverage,
  formatShare,
  hasFilmStats,
  passAverages,
  setDistribution,
  StatTag,
  statsByFilm
} from "@/lib/filmStats";

const NONE = { athlete_id: null, pass_rating: null, set_zone: null, block_outcome: null, result: null } as const;

function tag(overrides: Partial<StatTag> & Pick<StatTag, "tag">): StatTag {
  return { ...NONE, ...overrides };
}

const pass = (athlete_id: string | null, pass_rating: 0 | 1 | 2 | 3 | null) => tag({ tag: "pass", athlete_id, pass_rating });
const set = (set_zone: StatTag["set_zone"], athlete_id: string | null = "setter") => tag({ tag: "set", athlete_id, set_zone });
const block = (athlete_id: string | null, block_outcome: StatTag["block_outcome"], result: StatTag["result"] = null) =>
  tag({ tag: "block", athlete_id, block_outcome, result });

describe("setDistribution", () => {
  it("counts sets by zone and gives each zone its share", () => {
    const stats = setDistribution([set("4"), set("4"), set("4"), set("2")]);

    expect(stats.total).toBe(4);
    expect(stats.zones.find((zone) => zone.zone === "4")).toEqual({ zone: "4", count: 3, share: 0.75 });
    expect(stats.zones.find((zone) => zone.zone === "2")).toEqual({ zone: "2", count: 1, share: 0.25 });
  });

  it("always returns all six zones, in order, so the court never has a hole", () => {
    const stats = setDistribution([set("6")]);

    expect(stats.zones.map((zone) => zone.zone)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(stats.zones.find((zone) => zone.zone === "1")).toEqual({ zone: "1", count: 0, share: 0 });
  });

  it("keeps sets with no zone out of the shares and reports them separately", () => {
    const stats = setDistribution([set("4"), set(null), set(null)]);

    expect(stats.total).toBe(1);
    expect(stats.unzoned).toBe(2);
    expect(stats.zones.find((zone) => zone.zone === "4")?.share).toBe(1);
  });

  it("ignores other tags, even ones carrying a stale zone", () => {
    const stats = setDistribution([tag({ tag: "kill", set_zone: "4" }), tag({ tag: "note" })]);

    expect(stats.total).toBe(0);
    expect(stats.unzoned).toBe(0);
    expect(stats.zones.every((zone) => zone.count === 0 && zone.share === 0)).toBe(true);
  });

  it("returns zero shares, not NaN, with no tags", () => {
    expect(setDistribution([]).zones.every((zone) => zone.share === 0)).toBe(true);
  });
});

describe("passAverages", () => {
  it("averages each athlete's ratings on the 0-3 scale", () => {
    const stats = passAverages([pass("a", 3), pass("a", 2), pass("a", 1), pass("b", 0)]);

    expect(stats.athletes).toEqual([
      { athleteId: "a", count: 3, average: 2 },
      { athleteId: "b", count: 1, average: 0 }
    ]);
  });

  it("gives a team average weighted by passes, not an average of averages", () => {
    const stats = passAverages([pass("a", 3), pass("a", 3), pass("a", 3), pass("b", 1)]);

    expect(stats.team).toEqual({ count: 4, average: 2.5 });
  });

  it("counts a 0 as a pass (an aced or overpassed ball still drags the average)", () => {
    expect(passAverages([pass("a", 0), pass("a", 2)]).athletes[0]).toEqual({ athleteId: "a", count: 2, average: 1 });
  });

  it("skips passes with no rating and tags that aren't passes", () => {
    const stats = passAverages([pass("a", null), tag({ tag: "dig", athlete_id: "a", pass_rating: 3 }), pass("a", 2)]);

    expect(stats.team).toEqual({ count: 1, average: 2 });
  });

  it("skips a rating outside 0-3", () => {
    const stats = passAverages([tag({ tag: "pass", athlete_id: "a", pass_rating: 7 as never }), pass("a", 3)]);

    expect(stats.team).toEqual({ count: 1, average: 3 });
  });

  it("sorts best passer first, breaks ties by more passes, and puts unassigned passes last", () => {
    const stats = passAverages([
      pass(null, 3),
      pass("few", 2),
      pass("many", 2),
      pass("many", 2),
      pass("best", 3),
      pass("best", 2)
    ]);

    expect(stats.athletes.map((line) => line.athleteId)).toEqual(["best", "many", "few", null]);
  });

  it("has no team average when nothing is rated", () => {
    expect(passAverages([])).toEqual({ team: { count: 0, average: null }, athletes: [] });
  });

  it("reads passes saved by the three-tap flow", () => {
    const quick = buildQuickTag("pass", "3")!;
    const stats = passAverages([{ ...NONE, ...quick, athlete_id: "a" }]);

    expect(stats.athletes).toEqual([{ athleteId: "a", count: 1, average: 3 }]);
  });
});

describe("blockOutcomes", () => {
  it("counts each outcome per athlete", () => {
    const lines = blockOutcomes([block("a", "stuff"), block("a", "stuff"), block("a", "touch"), block("b", "tooled"), block("b", "missed")]);

    expect(lines).toEqual([
      { athleteId: "a", total: 3, stuff: 2, touch: 1, tooled: 0, missed: 0, error: 0, unrated: 0 },
      { athleteId: "b", total: 2, stuff: 0, touch: 0, tooled: 1, missed: 1, error: 0, unrated: 0 }
    ]);
  });

  it("counts a three-tap block Error, which has a result but no outcome", () => {
    const quick = buildQuickTag("block", "error")!;
    const lines = blockOutcomes([{ ...NONE, ...quick, athlete_id: "a" }]);

    expect(lines[0]).toMatchObject({ total: 1, error: 1, unrated: 0 });
  });

  it("counts a three-tap stuff once, from its outcome", () => {
    const quick = buildQuickTag("block", "stuff")!;
    const lines = blockOutcomes([{ ...NONE, ...quick, athlete_id: "a" }]);

    expect(lines[0]).toMatchObject({ total: 1, stuff: 1, error: 0 });
  });

  it("keeps a block with no outcome in the total and counts it as unrated", () => {
    const lines = blockOutcomes([block("a", null), block("a", "touch")]);

    expect(lines[0]).toMatchObject({ total: 2, touch: 1, unrated: 1 });
  });

  it("ignores tags that aren't blocks", () => {
    expect(blockOutcomes([tag({ tag: "kill", athlete_id: "a", block_outcome: "stuff" }), pass("a", 3)])).toEqual([]);
  });

  it("sorts by most blocks, then most stuffs, with unassigned blocks last", () => {
    const lines = blockOutcomes([
      block(null, "stuff"),
      block(null, "stuff"),
      block(null, "stuff"),
      block("touches", "touch"),
      block("touches", "touch"),
      block("stuffs", "stuff"),
      block("stuffs", "stuff"),
      block("one", "stuff")
    ]);

    expect(lines.map((line) => line.athleteId)).toEqual(["stuffs", "touches", "one", null]);
  });
});

describe("filmStatsForAthlete", () => {
  it("keeps only the given athlete's rows, and leaves the set map alone", () => {
    const tags = [pass("me", 3), pass("other", 1), block("me", "stuff"), block("other", "touch"), set("4", "other")];

    const mine = filmStatsForAthlete(tags, "me");

    expect(mine.passes.athletes).toEqual([{ athleteId: "me", count: 1, average: 3 }]);
    expect(mine.blocks.map((line) => line.athleteId)).toEqual(["me"]);
    expect(mine.sets.total).toBe(1);
  });

  it("shows nobody, not everybody, for an empty athlete id", () => {
    const stats = filmStatsForAthlete([pass("a", 3), block("b", "stuff")], "");

    expect(stats.passes.athletes).toEqual([]);
    expect(stats.blocks).toEqual([]);
  });

  it("returns everyone when no athlete is given", () => {
    const stats = filmStatsForAthlete([pass("a", 3), pass("b", 1)], null);

    expect(stats.passes.athletes).toHaveLength(2);
  });
});

describe("hasFilmStats", () => {
  it("is false for a film with only comments and unrated tags", () => {
    expect(hasFilmStats(filmStatsForAthlete([tag({ tag: "note" }), tag({ tag: "kill" }), pass("a", null)], null))).toBe(false);
  });

  it("is true once there is a rated pass, a zoned set or a block", () => {
    expect(hasFilmStats(filmStatsForAthlete([pass("a", 2)], null))).toBe(true);
    expect(hasFilmStats(filmStatsForAthlete([set("4")], null))).toBe(true);
    expect(hasFilmStats(filmStatsForAthlete([block("a", "touch")], null))).toBe(true);
  });
});

describe("statsByFilm", () => {
  const films = {
    old: { title: "vs. Central", created_at: "2026-09-01T12:00:00Z" },
    new: { title: "vs. North", created_at: "2026-09-20T12:00:00Z" }
  };

  it("gives one line per film, newest film first", () => {
    const lines = statsByFilm(
      [
        { ...pass("a", 3), film_id: "old" },
        { ...pass("a", 1), film_id: "old" },
        { ...block("a", "stuff"), film_id: "old" },
        { ...pass("a", 2), film_id: "new" }
      ],
      films
    );

    expect(lines.map((line) => line.title)).toEqual(["vs. North", "vs. Central"]);
    expect(lines[1].passes).toEqual({ count: 2, average: 2 });
    expect(lines[1].blocks).toMatchObject({ total: 1, stuff: 1 });
    expect(lines[0].blocks.total).toBe(0);
  });

  it("leaves out films with no rated pass and no block", () => {
    const lines = statsByFilm([{ ...tag({ tag: "kill", athlete_id: "a" }), film_id: "old" }], films);

    expect(lines).toEqual([]);
  });

  it("skips tags whose film is unknown (deleted while loading)", () => {
    expect(statsByFilm([{ ...pass("a", 3), film_id: "gone" }], films)).toEqual([]);
  });

  it("has no pass average for a film with only blocks", () => {
    const [line] = statsByFilm([{ ...block("a", "touch"), film_id: "old" }], films);

    expect(line.passes).toEqual({ count: 0, average: null });
  });
});

describe("formatting", () => {
  it("shows a pass average to two places, and a dash when there is none", () => {
    expect(formatPassAverage(2)).toBe("2.00");
    expect(formatPassAverage(2.125)).toBe("2.13");
    expect(formatPassAverage(null)).toBe("-");
  });

  it("shows a share as a whole percent", () => {
    expect(formatShare(0.75)).toBe("75%");
    expect(formatShare(1 / 3)).toBe("33%");
    expect(formatShare(0)).toBe("0%");
  });
});
