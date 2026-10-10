import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  newPasswordProblem,
  passwordMatchState,
  PASSWORD_TOO_SHORT,
  PASSWORDS_DONT_MATCH
} from "@/lib/passwordForm";

describe("newPasswordProblem", () => {
  it("accepts two identical passwords of the minimum length", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(newPasswordProblem(password, password)).toBeNull();
  });

  it("rejects a password one character under the minimum", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(newPasswordProblem(password, password)).toBe(PASSWORD_TOO_SHORT);
  });

  it("reports length before a mismatch, since the short password is wrong either way", () => {
    expect(newPasswordProblem("abc", "xyz")).toBe(PASSWORD_TOO_SHORT);
  });

  it("rejects a confirm password that differs", () => {
    expect(newPasswordProblem("volleyball1", "volleyball2")).toBe(PASSWORDS_DONT_MATCH);
  });

  it("rejects an empty confirm password", () => {
    expect(newPasswordProblem("volleyball1", "")).toBe(PASSWORDS_DONT_MATCH);
  });

  it("compares exactly: case and surrounding spaces count", () => {
    expect(newPasswordProblem("Volleyball1", "volleyball1")).toBe(PASSWORDS_DONT_MATCH);
    expect(newPasswordProblem("volleyball1", "volleyball1 ")).toBe(PASSWORDS_DONT_MATCH);
    expect(newPasswordProblem(" volleyball1 ", " volleyball1 ")).toBeNull();
  });
});

describe("passwordMatchState", () => {
  it("is empty until something is typed in the confirm field", () => {
    expect(passwordMatchState("", "")).toBe("empty");
    expect(passwordMatchState("volleyball1", "")).toBe("empty");
  });

  it("is a mismatch while the confirm field is still being typed", () => {
    expect(passwordMatchState("volleyball1", "volley")).toBe("mismatch");
  });

  it("is a match once both are identical", () => {
    expect(passwordMatchState("volleyball1", "volleyball1")).toBe("match");
  });

  it("is a mismatch when the confirm field has text and the password is empty", () => {
    expect(passwordMatchState("", "volleyball1")).toBe("mismatch");
  });
});
