import { describe, expect, it } from "vitest";

import { parseWholeNumber } from "@/lib/numberInput";

describe("parseWholeNumber", () => {
  it("reads one- and two-digit numbers", () => {
    expect(parseWholeNumber("3")).toBe(3);
    expect(parseWholeNumber("12")).toBe(12);
    expect(parseWholeNumber("45")).toBe(45);
  });

  it("returns null for an empty field instead of a default", () => {
    // The old field turned "" into 1, so typing 12 after clearing gave 112.
    expect(parseWholeNumber("")).toBeNull();
    expect(parseWholeNumber("   ")).toBeNull();
  });

  it("rejects numbers under the minimum", () => {
    expect(parseWholeNumber("0")).toBeNull();
    expect(parseWholeNumber("0", 0)).toBe(0);
    expect(parseWholeNumber("4", 5)).toBeNull();
    expect(parseWholeNumber("5", 5)).toBe(5);
  });

  it("rejects anything that isn't a whole number", () => {
    expect(parseWholeNumber("-3")).toBeNull();
    expect(parseWholeNumber("2.5")).toBeNull();
    expect(parseWholeNumber("1e3")).toBeNull();
    expect(parseWholeNumber("8-10")).toBeNull();
    expect(parseWholeNumber("abc")).toBeNull();
  });

  it("accepts leading zeros and surrounding spaces", () => {
    expect(parseWholeNumber("012")).toBe(12);
    expect(parseWholeNumber(" 10 ")).toBe(10);
  });

  it("rejects numbers too large to be exact", () => {
    expect(parseWholeNumber("99999999999999999999")).toBeNull();
  });
});
