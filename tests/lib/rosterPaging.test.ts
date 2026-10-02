import { describe, expect, it } from "vitest";

import { ROSTER_PAGE_SIZE, rosterPageRange, splitRosterPage } from "@/lib/rosterPaging";

describe("rosterPageRange", () => {
  it("asks for one row past the page so it can tell whether more exist", () => {
    expect(rosterPageRange(0, 100)).toEqual({ from: 0, to: 100 });
    expect(rosterPageRange(100, 100)).toEqual({ from: 100, to: 200 });
  });

  it("defaults to ROSTER_PAGE_SIZE", () => {
    expect(rosterPageRange(0)).toEqual({ from: 0, to: ROSTER_PAGE_SIZE });
  });

  it("keeps a single team well inside one page", () => {
    expect(ROSTER_PAGE_SIZE).toBeGreaterThanOrEqual(50);
  });
});

describe("splitRosterPage", () => {
  it("returns every row and no more when the page is short", () => {
    expect(splitRosterPage([1, 2, 3], 5)).toEqual({ rows: [1, 2, 3], hasMore: false });
  });

  it("returns exactly a full page with no more", () => {
    expect(splitRosterPage([1, 2, 3], 3)).toEqual({ rows: [1, 2, 3], hasMore: false });
  });

  it("drops the probe row and reports more", () => {
    expect(splitRosterPage([1, 2, 3, 4], 3)).toEqual({ rows: [1, 2, 3], hasMore: true });
  });

  it("handles an empty page", () => {
    expect(splitRosterPage([], 3)).toEqual({ rows: [], hasMore: false });
  });
});
