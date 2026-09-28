import { describe, expect, it } from "vitest";

import { matchAthlete, parseVoiceCommand, VoiceRosterEntry } from "@/lib/filmVoice";

const roster: VoiceRosterEntry[] = [
  { userId: "u-jayden", displayName: "Jayden Loring" },
  { userId: "u-maya", displayName: "Maya" },
  { userId: "u-chris", displayName: "Chris Park" },
  { userId: "u-steve", displayName: "Steve" },
  { userId: "u-alexandra", displayName: "Alexandra Ruiz" }
];

function parsed(text: string) {
  const result = parseVoiceCommand(text, roster);
  if (!result.ok) throw new Error(`expected "${text}" to parse, heard "${result.heard}"`);
  return result;
}

describe("parseVoiceCommand", () => {
  it("parses 'Jayden kill cross'", () => {
    const result = parsed("Jayden kill cross");
    expect(result.tag).toBe("kill");
    expect(result.details.attack_direction).toBe("cross");
    expect(result.athleteId).toBe("u-jayden");
  });

  it("parses 'Maya pass two'", () => {
    const result = parsed("Maya pass two");
    expect(result.tag).toBe("pass");
    expect(result.details.pass_rating).toBe(2);
    expect(result.athleteId).toBe("u-maya");
  });

  it("parses 'pass three' with no athlete (caller uses the selected one)", () => {
    const result = parsed("pass three");
    expect(result.details.pass_rating).toBe(3);
    expect(result.athleteId).toBeNull();
  });

  it("parses 'set zone four slide'", () => {
    const result = parsed("set zone four slide");
    expect(result.tag).toBe("set");
    expect(result.details).toEqual({ set_zone: "4", set_type: "slide" });
  });

  it("parses 'block stuff'", () => {
    const result = parsed("block stuff");
    expect(result.tag).toBe("block");
    expect(result.details.block_outcome).toBe("stuff");
  });

  it("parses 'Chris ace'", () => {
    const result = parsed("Chris ace");
    expect(result.tag).toBe("ace");
    expect(result.athleteId).toBe("u-chris");
    expect(result.details.attack_direction).toBeUndefined();
  });

  it("parses 'serve error' without mistaking 'serve' for Steve", () => {
    const result = parsed("serve error");
    expect(result.tag).toBe("serve_error");
    expect(result.athleteId).toBeNull();
  });

  it("parses 'service error' as a serve error", () => {
    expect(parsed("Steve service error").tag).toBe("serve_error");
    expect(parsed("Steve service error").athleteId).toBe("u-steve");
  });

  it("parses a bare 'dig'", () => {
    const result = parsed("dig");
    expect(result.tag).toBe("dig");
    expect(result.details).toEqual({});
  });

  it("parses 'note bad transition' and keeps the note text", () => {
    const result = parsed("note bad transition");
    expect(result.tag).toBe("note");
    expect(result.note).toBe("bad transition");
  });

  it("accepts digits as well as number words", () => {
    expect(parsed("pass 1").details.pass_rating).toBe(1);
    expect(parsed("set 5 pipe").details).toEqual({ set_zone: "5", set_type: "pipe" });
  });

  it("matches a misheard name ('Jaden' → Jayden, 'Alexandria' → Alexandra)", () => {
    expect(parsed("Jaden kill line").athleteId).toBe("u-jayden");
    expect(parsed("Alexandria dig").athleteId).toBe("u-alexandra");
  });

  it("matches a misheard tag word ('keel' → kill)", () => {
    const result = parsed("Maya keel tip");
    expect(result.tag).toBe("kill");
    expect(result.details.attack_direction).toBe("tip");
  });

  it("handles homophones for numbers ('pass to', 'set zone for')", () => {
    expect(parsed("pass to").details.pass_rating).toBe(2);
    expect(parsed("set zone for").details.set_zone).toBe("4");
  });

  it("leaves missing details empty instead of failing", () => {
    expect(parsed("Chris kill").details).toEqual({});
    expect(parsed("set").details).toEqual({});
    expect(parsed("block").details).toEqual({});
  });

  it("ignores a pass rating out of range", () => {
    expect(parsed("pass five").details.pass_rating).toBeUndefined();
  });

  it("understands multi-word details ('cross court', 'back row')", () => {
    expect(parsed("error cross court").details.attack_direction).toBe("cross");
    expect(parsed("set zone six back row").details).toEqual({ set_zone: "6", set_type: "back_row" });
  });

  it("treats a lone 'stuff' as a stuff block", () => {
    const result = parsed("Steve stuff");
    expect(result.tag).toBe("block");
    expect(result.details.block_outcome).toBe("stuff");
    expect(result.athleteId).toBe("u-steve");
  });

  it("fails on speech with no tag word and reports what it heard", () => {
    expect(parseVoiceCommand("nice hustle Maya", roster)).toEqual({ ok: false, heard: "nice hustle Maya" });
    expect(parseVoiceCommand("   ", roster)).toEqual({ ok: false, heard: "" });
  });

  it("does not invent an athlete for an unknown name", () => {
    expect(parsed("Bartholomew kill").athleteId).toBeNull();
  });
});

describe("matchAthlete", () => {
  it("prefers an exact first-name match", () => {
    expect(matchAthlete("maya", roster)?.userId).toBe("u-maya");
  });

  it("rejects names that are too far off", () => {
    expect(matchAthlete("mike", roster)).toBeNull();
    expect(matchAthlete("x", roster)).toBeNull();
  });
});
