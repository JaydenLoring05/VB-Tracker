import { describe, expect, it } from "vitest";

import { describeTag } from "@/components/film/tagMeta";
import { buildQuickTag, clipStart, groupClipsByFilm, QUICK_RESULTS, QUICK_SKILLS, resultLabel } from "@/lib/filmQuickTag";

describe("buildQuickTag", () => {
  it("stores the skill as the tag and the result alongside it", () => {
    expect(buildQuickTag("attack", "kill")).toEqual({ tag: "attack", result: "kill", pass_rating: null, block_outcome: null });
    expect(buildQuickTag("serve", "in")).toEqual({ tag: "serve", result: "in", pass_rating: null, block_outcome: null });
  });

  it("also fills the V36 pass rating so existing pass stats keep working", () => {
    expect(buildQuickTag("pass", "3")?.pass_rating).toBe(3);
    expect(buildQuickTag("pass", "0")?.pass_rating).toBe(0);
  });

  it("fills the block outcome for stuffs and touches, but not for errors", () => {
    expect(buildQuickTag("block", "stuff")?.block_outcome).toBe("stuff");
    expect(buildQuickTag("block", "touch")?.block_outcome).toBe("touch");
    expect(buildQuickTag("block", "error")?.block_outcome).toBeNull();
  });

  it("rejects a result that doesn't belong to the skill", () => {
    expect(buildQuickTag("serve", "kill")).toBeNull();
    expect(buildQuickTag("dig", "3")).toBeNull();
  });

  it("offers two to four results for every skill, so a tag is always three taps", () => {
    for (const skill of QUICK_SKILLS) {
      const count = QUICK_RESULTS[skill.value].length;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(4);
    }
  });
});

describe("resultLabel and describeTag", () => {
  it("labels three-tap tags by their result", () => {
    expect(resultLabel("attack", "in_play")).toBe("In play");
    expect(describeTag({ tag: "attack", result: "kill" }, "Sam")).toBe("Attack · Kill · Sam");
    expect(describeTag({ tag: "pass", result: "2", pass_rating: 2 })).toBe("Pass · 2");
  });

  it("leaves older tags described as before", () => {
    expect(resultLabel("kill", null)).toBeNull();
    expect(describeTag({ tag: "pass", pass_rating: 3 }, "Sam")).toBe("Pass · 3 · Sam");
  });
});

describe("clipStart", () => {
  it("starts a few seconds before the tag, never before zero", () => {
    expect(clipStart(42)).toBe(37);
    expect(clipStart(2)).toBe(0);
  });
});

describe("groupClipsByFilm", () => {
  const film = (title: string, created_at: string) => ({ title, created_at });

  it("puts the newest film first and each film's clips in video order", () => {
    const groups = groupClipsByFilm([
      { id: "a", film_id: "f1", seconds: 90, team_film: film("vs. Central", "2026-09-01T00:00:00Z") },
      { id: "b", film_id: "f2", seconds: 30, team_film: film("vs. North", "2026-09-20T00:00:00Z") },
      { id: "c", film_id: "f1", seconds: 12, team_film: film("vs. Central", "2026-09-01T00:00:00Z") }
    ]);

    expect(groups.map((group) => group.title)).toEqual(["vs. North", "vs. Central"]);
    expect(groups[1].clips.map((clip) => clip.id)).toEqual(["c", "a"]);
  });

  it("skips tags whose film couldn't be read", () => {
    expect(groupClipsByFilm([{ id: "a", film_id: "gone", seconds: 5, team_film: null }])).toEqual([]);
  });
});
