"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

type Mode = "sign-in" | "sign-up" | "forgot-password";
type ResendState = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resetSent, setResetSent] = useState(false);

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
      setError(resendError.message);
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
      setError(resetError.message);
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
        setError(signInError.message);
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
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
    setNeedsConfirmation(true);
    setMode("sign-in");
  }

  return (
    <div className="auth-shell">
      <div className="panel auth-card">
        <div className="logo">🏐</div>
        <h1>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">ElevateOS — Athlete Operating System</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
          />

          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

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
    </div>
  );
}
