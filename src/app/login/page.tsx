"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Brand } from "@/components/shared/Brand";
import { PasswordField } from "@/components/shared/PasswordField";
import { authErrorMessage } from "@/lib/authErrors";
import { normalizeInviteCode, PENDING_INVITE_KEY } from "@/lib/invite";
import { googleOAuthRedirectTo, isGoogleSignInEnabled } from "@/lib/googleAuth";
import { MIN_PASSWORD_LENGTH, newPasswordProblem, passwordMatchState } from "@/lib/passwordForm";
import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

type Mode = "sign-in" | "sign-up" | "forgot-password";

// An invite code saved by /join/<code> before the athlete signed in or up.
function pendingInvite(): string | null {
  try {
    return normalizeInviteCode(window.localStorage.getItem(PENDING_INVITE_KEY));
  } catch {
    return null;
  }
}

// Inlined at build time. Off until the Google Cloud and Supabase dashboard setup is done.
const GOOGLE_SIGN_IN = isGoogleSignInEnabled(process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED);
type ResendState = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Sign-up only: the new password is too short or the two copies differ. Kept apart from
  // `error` so focus goes to the password fields, not back to the email.
  const [passwordProblem, setPasswordProblem] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resetSent, setResetSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  // A form-level error (wrong password, unknown email, missing email) is announced by
  // its role="alert"; moving focus to the first field puts the fix under the cursor.
  useEffect(() => {
    if (error) emailRef.current?.focus();
  }, [error]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const authError = params.get("authError");
    if (authError) {
      setError(authError);
      setNeedsConfirmation(true);
    }

    if (params.get("mode") === "sign-up") {
      setMode("sign-up");
    }

    if (authError || params.has("mode")) {
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setConfirmPassword("");
    setPasswordProblem("");
  }

  async function handleResend() {
    if (!email.trim()) {
      setError("Enter your email above first, then resend the confirmation link.");
      return;
    }

    setResendState("sending");
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim()
    });

    if (resendError) {
      setResendState("error");
      setError(authErrorMessage(resendError));
      return;
    }

    setResendState("sent");
    setError("");
    setMessage("Confirmation email sent. Check your inbox.");
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email above first.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback`
    });
    setLoading(false);

    if (resetError) {
      setError(authErrorMessage(resetError));
      return;
    }

    setError("");
    setResetSent(true);
    setMessage("Check your email for a password reset link.");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPasswordProblem("");
    setNeedsConfirmation(false);
    setResendState("idle");

    if (mode === "sign-up") {
      const problem = newPasswordProblem(password, confirmPassword);
      if (problem) {
        setPasswordProblem(problem);
        confirmRef.current?.focus();
        return;
      }
    }

    setLoading(true);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      setLoading(false);

      if (signInError) {
        setError(authErrorMessage(signInError));
        return;
      }

      // Came from an invite link: finish joining with one tap.
      const invite = pendingInvite();
      router.push(invite ? `/join/${invite}` : "/dashboard");
      router.refresh();
      return;
    }

    // Also store a pending invite on the account, so it survives a
    // confirmation email that opens in a different browser.
    const invite = pendingInvite();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      ...(invite ? { options: { data: { pending_invite: invite } } } : {})
    });

    setLoading(false);

    if (signUpError) {
      setError(authErrorMessage(signUpError));
      return;
    }

    if (data.session && data.user) {
      const trimmedName = name.trim();
      if (trimmedName) {
        await supabase
          .from("profiles")
          .upsert({ user_id: data.user.id, display_name: trimmedName }, { onConflict: "user_id" });
      }

      router.push("/onboarding");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
    setNeedsConfirmation(true);
    switchMode("sign-in");
  }


  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: googleOAuthRedirectTo(window.location.origin) }
    });

    // On success the browser is already navigating to Google.
    if (oauthError) {
      setError(authErrorMessage(oauthError));
      setLoading(false);
    }
  }
  const matchState = passwordMatchState(password, confirmPassword);

  return (
    <main id="main-content" tabIndex={-1} className="auth-shell">
      <Link href="/" className="auth-back-link">
        <span aria-hidden="true">←</span> Back to NextRep
      </Link>

      <div className="panel auth-card">
        <div className="auth-brand">
          <Brand />
        </div>
        <h1>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">NextRep: Athlete Operating System</p>

        <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
          {mode === "sign-up" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              ref={emailRef}
              type="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-error" : undefined}
            />
          </div>

          <PasswordField
            id="auth-password"
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setPasswordProblem("");
            }}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            invalid={Boolean(error)}
            describedBy={error ? "auth-error" : mode === "sign-up" ? "auth-password-hint" : undefined}
          >
            {mode === "sign-up" && !error && (
              <p className="auth-hint" id="auth-password-hint">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            )}
          </PasswordField>

          {mode === "sign-up" && (
            <PasswordField
              id="auth-confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                setPasswordProblem("");
              }}
              autoComplete="new-password"
              inputRef={confirmRef}
              invalid={Boolean(passwordProblem) || matchState === "mismatch"}
              describedBy="auth-confirm-status"
            >
              {/* One element for every state, so screen readers hear each change. */}
              <p
                id="auth-confirm-status"
                className={
                  passwordProblem || matchState === "mismatch"
                    ? "auth-error"
                    : matchState === "match"
                      ? "auth-hint auth-hint-ok"
                      : "auth-hint"
                }
                role={passwordProblem ? "alert" : "status"}
              >
                {passwordProblem ||
                  (matchState === "match"
                    ? "Passwords match."
                    : matchState === "mismatch"
                      ? "Passwords don't match yet."
                      : "Type it again so a typo can't lock you out.")}
              </p>
            </PasswordField>
          )}

          {error && (
            <p className="auth-error" id="auth-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="auth-success" role="status">
              {message}
            </p>
          )}

          {needsConfirmation && (
            <button
              type="button"
              className="auth-resend"
              onClick={handleResend}
              disabled={resendState === "sending"}
            >
              {resendState === "sending" ? "Resending…" : "Resend confirmation email"}
            </button>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "sign-in"
                ? "Sign In"
                : "Sign Up"}
          </button>
        </form>

        {GOOGLE_SIGN_IN && mode !== "forgot-password" && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <button type="button" className="auth-google-button" onClick={handleGoogleSignIn} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33Z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
                />
              </svg>
              Continue with Google
            </button>
            {mode === "sign-in" && (
              <p className="muted auth-google-legal">
                New to NextRep? Continuing with Google creates an account and means you agree to our{" "}
                <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
              </p>
            )}
          </>
        )}

        {mode !== "sign-in" && (
          <div className="auth-legal">
            <p className="muted">
              By creating an account you agree to our{" "}
              <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
            <p className="muted">
              NextRep doesn&apos;t diagnose injuries or provide medical advice. Always
              consult a medical professional for pain or injury concerns. Athletes under 18
              should have a parent or guardian aware of their use of the app.
            </p>
          </div>
        )}

        <div className="auth-switch">
          {mode === "sign-in" ? (
            <span>
              Need an account?{" "}
              <button type="button" onClick={() => switchMode("sign-up")}>
                Sign up
              </button>
            </span>
          ) : null}
          {mode === "sign-in" && !resetSent && (
            <button type="button" className="auth-resend" onClick={handleForgotPassword} disabled={loading}>
              Forgot password?
            </button>
          )}
          {mode !== "sign-in" && (
            <span>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("sign-in")}>
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
