"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
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

      router.push("/");
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
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
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
