import { describe, expect, it } from "vitest";

import { exercises } from "@/data/exercises";
import {
  buildLibrary,
  cuesFor,
  CUES_MAX,
  emptyTeamExerciseInput,
  filterLibrary,
  findTeamExercise,
  measureFor,
  normalizeVideoUrl,
  parseCues,
  pickActiveTeamId,
  rowToTeamExercise,
  TEAM_FILTER,
  TeamExercise,
  TeamExerciseInput,
  teamExerciseToInput,
  validateTeamExerciseInput
} from "@/lib/teamExercises";

const stepUp: TeamExercise = {
  id: "te-1",
  name: "Box Step-Up with Knee Drive",
  category: "Knee Strength",
  purpose: "Single-leg strength for the approach.",
  cues: ["Whole foot on the box", "Drive the knee up"],
  videoUrl: "https://youtube.com/watch?v=abc",
  measure: "reps"
};

const pancake: TeamExercise = {
  id: "te-2",
  name: "Standing Pancake",
  category: "Mobility",
  purpose: "",
  cues: [],
  videoUrl: null,
  measure: "time"
};

const input = (overrides: Partial<TeamExerciseInput> = {}): TeamExerciseInput => ({
  ...emptyTeamExerciseInput(),
  name: "Lateral Bound and Stick",
  ...overrides
});

describe("parseCues", () => {
  it("reads one cue per line and drops blanks and bullets", () => {
    expect(parseCues("- Brace first\n\n  • Push the floor away  \n2. Control the lowering\n* Stay tall")).toEqual([
      "Brace first",
      "Push the floor away",
      "Control the lowering",
      "Stay tall"
    ]);
  });

  it("handles Windows line endings and an empty box", () => {
    expect(parseCues("One\r\nTwo")).toEqual(["One", "Two"]);
    expect(parseCues("   \n ")).toEqual([]);
  });
});

describe("normalizeVideoUrl", () => {
  it("treats an empty box as no link", () => {
    expect(normalizeVideoUrl("  ")).toEqual({ ok: true, url: null });
  });

  it("keeps an https link and adds https:// when it's left off", () => {
    expect(normalizeVideoUrl("https://youtu.be/abc")).toEqual({ ok: true, url: "https://youtu.be/abc" });
    expect(normalizeVideoUrl("youtube.com/watch?v=abc")).toEqual({
      ok: true,
      url: "https://youtube.com/watch?v=abc"
    });
  });

  it("rejects http, other schemes, and things that aren't links", () => {
    expect(normalizeVideoUrl("http://example.com/video").ok).toBe(false);
    expect(normalizeVideoUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeVideoUrl("not a link").ok).toBe(false);
    expect(normalizeVideoUrl("localhost").ok).toBe(false);
  });

  it("rejects a link over 500 characters", () => {
    expect(normalizeVideoUrl(`https://example.com/${"a".repeat(500)}`).ok).toBe(false);
  });
});

describe("validateTeamExerciseInput", () => {
  it("needs only a name, and saves blanks as empty", () => {
    const result = validateTeamExerciseInput(input(), []);
    expect(result).toEqual({
      ok: true,
      payload: {
        name: "Lateral Bound and Stick",
        category: "Volleyball Conditioning",
        purpose: null,
        cues: [],
        video_url: null,
        measure: "reps"
      }
    });
  });

  it("tidies the name and keeps the fields the coach filled in", () => {
    const result = validateTeamExerciseInput(
      input({
        name: "  Lateral   Bound  ",
        category: "Landing Mechanics",
        purpose: " Stick the landing ",
        cuesText: "Soft knees\nHold two seconds",
        videoUrl: "youtu.be/xyz",
        measure: "time"
      }),
      []
    );
    expect(result.ok && result.payload).toEqual({
      name: "Lateral Bound",
      category: "Landing Mechanics",
      purpose: "Stick the landing",
      cues: ["Soft knees", "Hold two seconds"],
      video_url: "https://youtu.be/xyz",
      measure: "time"
    });
  });

  it("asks for a name", () => {
    const result = validateTeamExerciseInput(input({ name: "   " }), []);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.name).toBe("Give the exercise a name.");
  });

  it("rejects a name over 80 characters", () => {
    const result = validateTeamExerciseInput(input({ name: "x".repeat(81) }), []);
    expect(!result.ok && result.errors.name).toMatch(/80 characters/);
  });

  it("rejects a built-in exercise's name, ignoring case and spacing", () => {
    const builtIn = exercises[0].name;
    const result = validateTeamExerciseInput(input({ name: ` ${builtIn.toUpperCase()} ` }), []);
    expect(!result.ok && result.errors.name).toBe("That exercise is already in the library.");
  });

  it("rejects another team exercise's name but lets an edit keep its own", () => {
    const duplicate = validateTeamExerciseInput(input({ name: "box step-up with knee drive" }), [stepUp]);
    expect(!duplicate.ok && duplicate.errors.name).toBe("Your team already has an exercise with this name.");

    const sameOne = validateTeamExerciseInput(input({ name: stepUp.name }), [stepUp], stepUp.id);
    expect(sameOne.ok).toBe(true);
  });

  it("caps the cues at eight", () => {
    const nine = Array.from({ length: CUES_MAX + 1 }, (_, i) => `Cue ${i + 1}`).join("\n");
    const result = validateTeamExerciseInput(input({ cuesText: nine }), []);
    expect(!result.ok && result.errors.cues).toMatch(/Up to 8 cues/);
  });

  it("rejects a bad video link and a long purpose", () => {
    const result = validateTeamExerciseInput(input({ videoUrl: "http://example.com", purpose: "x".repeat(281) }), []);
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["purpose", "videoUrl"]);
  });

  it("falls back to a known category and to reps", () => {
    const result = validateTeamExerciseInput(input({ category: "Made Up", measure: "laps" }), []);
    expect(result.ok && result.payload.category).toBe("Volleyball Conditioning");
    expect(result.ok && result.payload.measure).toBe("reps");
  });
});

describe("rows and the form", () => {
  it("reads a row defensively", () => {
    expect(
      rowToTeamExercise({
        id: "te-9",
        team_id: "team-1",
        name: " Wall Sit Hold ",
        category: "Nope",
        purpose: null,
        cues: ["Back flat", "  "],
        video_url: "",
        measure: "time"
      })
    ).toEqual({
      id: "te-9",
      name: "Wall Sit Hold",
      category: "Volleyball Conditioning",
      purpose: "",
      cues: ["Back flat"],
      videoUrl: null,
      measure: "time"
    });
  });

  it("round-trips an exercise through the edit form", () => {
    const result = validateTeamExerciseInput(teamExerciseToInput(stepUp), [stepUp], stepUp.id);
    expect(result.ok && result.payload).toEqual({
      name: stepUp.name,
      category: stepUp.category,
      purpose: stepUp.purpose,
      cues: stepUp.cues,
      video_url: stepUp.videoUrl,
      measure: stepUp.measure
    });
  });
});

describe("the library with team exercises", () => {
  const library = buildLibrary([pancake, stepUp]);

  it("lists the team's exercises first, A to Z, then every built-in one", () => {
    expect(library.slice(0, 2).map((exercise) => exercise.name)).toEqual([stepUp.name, pancake.name]);
    expect(library).toHaveLength(exercises.length + 2);
    expect(library[0]).toMatchObject({ level: null, mistakes: [], substitutions: [], video: stepUp.videoUrl });
  });

  const filter = (category: string, level = "All", search = "") =>
    filterLibrary(library, { category, level, search }).map((exercise) => exercise.name);

  it("shows only team exercises under the Your team chip", () => {
    expect(filter(TEAM_FILTER)).toEqual([stepUp.name, pancake.name]);
  });

  it("puts a team exercise under its category with the built-in ones", () => {
    const knee = filter("Knee Strength");
    expect(knee).toContain(stepUp.name);
    expect(knee).not.toContain(pancake.name);
    expect(knee.length).toBeGreaterThan(1);
  });

  it("leaves team exercises out of a level filter, since they have no level", () => {
    expect(filter("All", "Beginner")).not.toContain(stepUp.name);
    expect(filter("All", "Beginner").length).toBeGreaterThan(0);
  });

  it("searches a team exercise's cues", () => {
    expect(filter("All", "All", "whole foot on the box")).toEqual([stepUp.name]);
  });

  it("is just the built-in list with no team exercises", () => {
    expect(filterLibrary(buildLibrary([]), { category: "All", level: "All", search: "" })).toHaveLength(
      exercises.length
    );
  });
});

describe("Workout Mode lookups", () => {
  it("finds a team exercise whatever the case or spacing in the program", () => {
    expect(findTeamExercise("box  step-up with KNEE drive", [stepUp])).toBe(stepUp);
    expect(findTeamExercise("Something else", [stepUp])).toBeUndefined();
  });

  it("reads cues from the built-in list first, then the team's", () => {
    const builtIn = exercises[0];
    expect(cuesFor(builtIn.name, [stepUp])).toEqual(builtIn.cues);
    expect(cuesFor(stepUp.name, [stepUp])).toEqual(stepUp.cues);
    expect(cuesFor("Typed by a coach", [stepUp])).toEqual([]);
  });

  it("uses the coach's reps-or-time choice for a team exercise", () => {
    // "Standing Pancake" matches no timed pattern, so only the coach's choice makes it timed.
    expect(measureFor(pancake.name, [])).toBe("reps");
    expect(measureFor(pancake.name, [pancake])).toBe("time");
    expect(measureFor(stepUp.name, [stepUp])).toBe("reps");
  });

  it("keeps the built-in rule for library exercises and other names", () => {
    expect(measureFor("Planks", [])).toBe("time");
    expect(measureFor("Wall sit", [])).toBe("time");
  });
});

describe("pickActiveTeamId", () => {
  it("has no team without a membership", () => {
    expect(pickActiveTeamId([], "t1")).toBeNull();
  });

  it("uses the team saved in this browser when the user is on it", () => {
    expect(pickActiveTeamId(["t1", "t2"], "t2", ["t1", "t2"])).toBe("t2");
  });

  it("ignores a saved team the user has left, and takes the newest", () => {
    expect(pickActiveTeamId(["t1", "t2"], "gone", ["t2", "t1"])).toBe("t2");
  });

  it("falls back to the only or first membership", () => {
    expect(pickActiveTeamId(["t1"], null)).toBe("t1");
    expect(pickActiveTeamId(["t1", "t2"], null)).toBe("t1");
  });
});
