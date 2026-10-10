"use client";

import { Eye, EyeOff } from "lucide-react";
import { ReactNode, Ref, useState } from "react";

import { MIN_PASSWORD_LENGTH } from "@/lib/passwordForm";

/**
 * A labelled password input with a show/hide button, for the sign-in,
 * sign-up and reset forms. Each field keeps its own visibility, so showing
 * the first password doesn't reveal the confirm field too.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  inputRef,
  invalid,
  describedBy,
  children
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  inputRef?: Ref<HTMLInputElement>;
  invalid?: boolean;
  describedBy?: string;
  /** Hint or status line shown under the field. */
  children?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          ref={inputRef}
          type={visible ? "text" : "password"}
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {children}
    </div>
  );
}
