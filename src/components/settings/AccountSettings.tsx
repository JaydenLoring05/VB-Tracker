"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAccountData } from "@/hooks/useAccountData";
import { DELETE_CONFIRMATION_PHRASE, isDeleteConfirmed } from "@/lib/accountData";

import { ReminderPreference } from "./ReminderPreference";

export function AccountSettings() {
  const { ownedTeams, exporting, deleting, error, exportData, deleteAccount } = useAccountData();
  const [confirmation, setConfirmation] = useState("");

  async function handleDelete(event: FormEvent) {
    event.preventDefault();
    if (!isDeleteConfirmed(confirmation) || deleting) return;
    const deleted = await deleteAccount();
    if (deleted) window.location.assign("/?account=deleted");
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <ReminderPreference />

      <section className="panel">
        <h2>Download your data</h2>
        <p className="muted">
          One JSON file with everything stored for your account: profile, check-ins, workouts and sets, PRs, calendar,
          exercise swaps, team memberships, and film tags about your plays.
        </p>
        <button type="button" onClick={exportData} disabled={exporting}>
          {exporting ? "Preparing..." : "Download my data"}
        </button>
      </section>

      <section className="panel settings-danger">
        <h2>Delete your account</h2>
        <p className="muted">
          This permanently deletes your account and all of your training, check-in and profile data. It can&apos;t be
          undone. Download your data first if you want a copy.
        </p>

        {ownedTeams.length > 0 && (
          <div className="settings-warning" role="note">
            <p>
              <strong>You coach {ownedTeams.length === 1 ? "a team" : `${ownedTeams.length} teams`}.</strong> Deleting
              your account also deletes{" "}
              {ownedTeams.length === 1 ? "it" : "them"} with their rosters, programs, calendar and film:
            </p>
            <ul>
              {ownedTeams.map((team) => (
                <li key={team.id}>{team.name}</li>
              ))}
            </ul>
            <p className="muted">Your athletes keep their own accounts and training data.</p>
          </div>
        )}

        <form onSubmit={handleDelete}>
          <label>
            Type <strong>{DELETE_CONFIRMATION_PHRASE}</strong> to confirm
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="submit" className="danger-button" disabled={!isDeleteConfirmed(confirmation) || deleting}>
            {deleting ? "Deleting..." : "Delete my account"}
          </button>
        </form>

        {error && (
          <p className="muted" role="alert">
            {error}
          </p>
        )}
      </section>

      <p className="muted">
        See the <Link href="/privacy">Privacy Policy</Link> for what we collect and who can see it.
      </p>
    </div>
  );
}
