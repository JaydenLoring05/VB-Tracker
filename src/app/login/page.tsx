"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

type Mode = "sign-in" | "sign-up";
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

  async function handleGoogleSignIn() {
    setError("");
    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (oauthError) setError(oauthError.message);
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
        <p className="muted">Volleyball Tracker Athlete Operating System</p>

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

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button type="button" className="auth-google-button" onClick={handleGoogleSignIn}>
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

        <div className="auth-switch">
          {mode === "sign-in" ? (
            <span>
              Need an account?{" "}
              <button type="button" onClick={() => setMode("sign-up")}>
                Sign up
              </button>
            </span>
          ) : (
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
