"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/shared/Brand";
import { authErrorMessage } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Announced by its role="alert"; focus goes back to the first field so the fix is under the cursor.
  useEffect(() => {
    if (error) passwordRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(authErrorMessage(updateError));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main id="main-content" tabIndex={-1} className="auth-shell">
      <div className="panel auth-card">
        <div className="auth-brand">
          <Brand />
        </div>
        <h1>Set a new password</h1>

        <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              ref={passwordRef}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "reset-error" : "reset-password-hint"}
            />
            {!error && (
              <p className="auth-hint" id="reset-password-hint">
                At least 6 characters.
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "reset-error" : undefined}
            />
          </div>

          {error && (
            <p className="auth-error" id="reset-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
