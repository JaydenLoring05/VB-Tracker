"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { MAX_MEMBER_NAME_LENGTH } from "@/lib/memberName";

/** Inline name field that replaces an athlete's name on the roster while the coach renames them. */
export function RosterNameEditor({
  initialName,
  onSave,
  onCancel
}: {
  initialName: string;
  /** Resolves to null on success or an error message to show. */
  onSave: (name: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const message = await onSave(name);
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <form className="roster-name-editor" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        value={name}
        maxLength={MAX_MEMBER_NAME_LENGTH}
        aria-label="Athlete name"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "roster-name-error" : undefined}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />
      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
      <button type="button" className="ghost" onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      {error && (
        <p id="roster-name-error" className="roster-name-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
