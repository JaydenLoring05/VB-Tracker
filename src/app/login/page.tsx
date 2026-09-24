"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Brand } from "@/components/shared/Brand";
import { authErrorMessage } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

type Mode = "sign-in" | "sign-up" | "forgot-password";
type ResendState = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resetSent, setResetSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

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
    setNeedsConfirmation(false);
    setResendState("idle");
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

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password
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
    setMode("sign-in");
  }

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

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-error" : mode === "sign-up" ? "auth-password-hint" : undefined}
            />
            {mode === "sign-up" && !error && (
              <p className="auth-hint" id="auth-password-hint">
                At least 6 characters.
              </p>
            )}
          </div>

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
              <button type="button" onClick={() => setMode("sign-up")}>
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
              <button type="button" onClick={() => setMode("sign-in")}>
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
