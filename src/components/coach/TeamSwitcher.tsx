"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";

import { Team } from "@/types";

export function TeamSwitcher({
  teams,
  activeTeamId,
  onSelect,
  onCreateTeam
}: {
  teams: Team[];
  activeTeamId: string;
  onSelect: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<boolean>;
}) {
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newTeamName.trim() || creating) return;

    setCreating(true);
    const ok = await onCreateTeam(newTeamName.trim());
    setCreating(false);

    if (ok) {
      setNewTeamName("");
      setShowNewTeamForm(false);
    }
  }

  return (
    <div className="team-switcher">
      {teams.length > 1 && (
        <select
          className="team-switcher-select"
          aria-label="Active team"
          value={activeTeamId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="ghost team-switcher-new"
        onClick={() => setShowNewTeamForm((current) => !current)}
        aria-expanded={showNewTeamForm}
      >
        <Plus size={14} /> New Team
      </button>

      {showNewTeamForm && (
        <form className="team-switcher-new-form" onSubmit={handleCreate}>
          <input
            aria-label="New team name"
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Team name, ex: JV Girls"
            autoFocus
          />
          <button type="submit" disabled={!newTeamName.trim() || creating}>
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      )}
    </div>
  );
}
