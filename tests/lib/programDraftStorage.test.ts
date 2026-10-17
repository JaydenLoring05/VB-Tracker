import { describe, expect, it } from "vitest";

import { blankProgram } from "@/lib/customProgram";
import { clearProgramDraft, loadProgramDraft, programDraftKey, saveProgramDraft } from "@/lib/programDraftStorage";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    map
  };
}

describe("program draft storage", () => {
  const draft = { name: "Barbell block", days: blankProgram().days };

  it("keeps a draft per team and brings it back", () => {
    const storage = memoryStorage();
    saveProgramDraft("team-1", { ...draft, id: "p9" }, storage, new Date("2026-10-17T23:50:00Z"));
    expect(loadProgramDraft("team-1", storage)).toEqual({
      draft: { ...draft, id: "p9" },
      changedAt: "2026-10-17T23:50:00.000Z"
    });
    expect(loadProgramDraft("team-2", storage)).toBeNull();
  });

  it("clears a draft", () => {
    const storage = memoryStorage();
    saveProgramDraft("team-1", draft, storage);
    clearProgramDraft("team-1", storage);
    expect(storage.map.has(programDraftKey("team-1"))).toBe(false);
  });

  it("ignores broken or empty data and a storage that throws", () => {
    const storage = memoryStorage();
    storage.setItem(programDraftKey("t"), "{not json");
    expect(loadProgramDraft("t", storage)).toBeNull();
    storage.setItem(programDraftKey("t"), JSON.stringify({ draft: { name: "x", days: [] } }));
    expect(loadProgramDraft("t", storage)).toBeNull();

    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("full");
      },
      removeItem: () => {
        throw new Error("blocked");
      }
    };
    expect(loadProgramDraft("t", throwing)).toBeNull();
    expect(() => saveProgramDraft("t", draft, throwing)).not.toThrow();
    expect(() => clearProgramDraft("t", throwing)).not.toThrow();
    expect(loadProgramDraft("t", null)).toBeNull();
  });
});
