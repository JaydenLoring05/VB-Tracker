import { describe, expect, it } from "vitest";

import { googleOAuthRedirectTo, isGoogleSignInEnabled, nameFromOAuthMetadata, oauthErrorMessage } from "@/lib/googleAuth";

describe("isGoogleSignInEnabled", () => {
  it("is off unless the flag is exactly true", () => {
    expect(isGoogleSignInEnabled(undefined)).toBe(false);
    expect(isGoogleSignInEnabled("")).toBe(false);
    expect(isGoogleSignInEnabled("false")).toBe(false);
    expect(isGoogleSignInEnabled("1")).toBe(false);
  });

  it("is on for true, ignoring case and spaces", () => {
    expect(isGoogleSignInEnabled("true")).toBe(true);
    expect(isGoogleSignInEnabled(" TRUE ")).toBe(true);
  });
});

describe("googleOAuthRedirectTo", () => {
  it("comes back to the auth callback on the same origin", () => {
    expect(googleOAuthRedirectTo("https://volleyball-tracker-beta.vercel.app")).toBe(
      "https://volleyball-tracker-beta.vercel.app/auth/callback"
    );
    expect(googleOAuthRedirectTo("http://localhost:3000/")).toBe("http://localhost:3000/auth/callback");
  });
});

describe("oauthErrorMessage", () => {
  it("is null when the provider returned no error", () => {
    expect(oauthErrorMessage(new URLSearchParams("code=abc"))).toBeNull();
  });

  it("explains a cancelled Google sign-in", () => {
    expect(oauthErrorMessage(new URLSearchParams("error=access_denied&error_description=User+denied"))).toBe(
      "Google sign-in was cancelled. Try again, or sign in with your email and password."
    );
  });

  it("gives a generic message for other provider errors, without echoing them", () => {
    expect(oauthErrorMessage(new URLSearchParams("error=server_error&error_description=<script>"))).toBe(
      "Google sign-in didn't work. Try again, or sign in with your email and password."
    );
  });
});

describe("nameFromOAuthMetadata", () => {
  it("prefers full_name, then name", () => {
    expect(nameFromOAuthMetadata({ full_name: "Ava Thompson", name: "Ava" })).toBe("Ava Thompson");
    expect(nameFromOAuthMetadata({ name: "Ava T" })).toBe("Ava T");
  });

  it("trims, collapses spaces and caps the length", () => {
    expect(nameFromOAuthMetadata({ full_name: "  Ava   Thompson " })).toBe("Ava Thompson");
    expect(nameFromOAuthMetadata({ full_name: "x".repeat(200) })?.length).toBe(60);
  });

  it("returns null for missing, empty, non-string or email-looking names", () => {
    expect(nameFromOAuthMetadata(undefined)).toBeNull();
    expect(nameFromOAuthMetadata({})).toBeNull();
    expect(nameFromOAuthMetadata({ full_name: "   " })).toBeNull();
    expect(nameFromOAuthMetadata({ full_name: 42 })).toBeNull();
    expect(nameFromOAuthMetadata({ full_name: "ava@example.com" })).toBeNull();
  });
});
