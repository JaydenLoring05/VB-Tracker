"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { useProfile } from "@/hooks/useProfile";
import { useTeam } from "@/hooks/useTeam";

type Role = "coach" | "athlete";

const POSITIONS = ["Outside Hitter", "Middle Blocker", "Opposite", "Setter", "Libero/DS"];
const COMPETITIVE_LEVELS = ["Middle School", "JV", "Varsity", "Club", "College"];

const TRAINING_GOAL_OPTIONS = [
  "Increase vertical jump",
  "Hitting power",
  "Blocking footwork and timing",
  "Ball-handling speed",
  "Lateral agility",
  "First-step speed",
  "Shoulder health",
  "Knee health"
];

const POSITION_DEFAULT_GOALS: Record<string, string[]> = {
  "Outside Hitter": ["Increase vertical jump", "Hitting power"],
  "Middle Blocker": ["Increase vertical jump", "Blocking footwork and timing"],
  Opposite: ["Hitting power", "Increase vertical jump"],
  Setter: ["Ball-handling speed", "Lateral agility"],
  "Libero/DS": ["Lateral agility", "First-step speed"]
};

const TOTAL_STEPS = 4;

export function OnboardingFlow() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const { createTeam, joinTeam, error: teamError } = useTeam();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);

  const [teamName, setTeamName] = useState("");
  const [competitiveLevel, setCompetitiveLevel] = useState(COMPETITIVE_LEVELS[2]);
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [athletesExpected, setAthletesExpected] = useState("");
  const [trainingDays, setTrainingDays] = useState("");

  const [position, setPosition] = useState(POSITIONS[0]);
  const [goals, setGoals] = useState<string[]>(POSITION_DEFAULT_GOALS[POSITIONS[0]] ?? []);
  const [inviteCode, setInviteCode] = useState("");

  const [saving, setSaving] = useState(false);

  // Each step replaces the last one in place, so move focus to the new step's heading:
  // keyboard and screen reader users would otherwise be left on a control that vanished.
  const flowRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const heading = flowRef.current?.querySelector<HTMLElement>("h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }, [step]);

  function selectRole(next: Role) {
    setRole(next);
    setStep(2);
  }

  function selectPosition(next: string) {
    setPosition(next);
    setGoals(POSITION_DEFAULT_GOALS[next] ?? []);
  }

  function toggleGoal(goal: string) {
    setGoals((current) => (current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]));
  }

  async function handleRoleDetailsSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    if (role === "coach") {
      await updateProfile({
        competitive_level: competitiveLevel,
        season_start: seasonStart || null,
        season_end: seasonEnd || null,
        training_days_per_week: trainingDays ? Number(trainingDays) : null,
        athletes_expected: athletesExpected ? Number(athletesExpected) : null
      });
    } else {
      await updateProfile({ position, training_goals: goals });
    }

    setSaving(false);
    setStep(3);
  }

  async function handleTeamStep(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    const ok = role === "coach" ? await createTeam(teamName.trim()) : await joinTeam(inviteCode.trim());

    setSaving(false);
    if (ok) setStep(4);
  }

  function finish() {
    router.push(role === "coach" ? "/coach" : "/dashboard");
  }

  return (
    <div className="panel onboarding-flow" ref={flowRef}>
      <p className="muted onboarding-step-indicator">
        Step {step} of {TOTAL_STEPS}
      </p>

      {step === 1 && (
        <div className="onboarding-step">
          <h2>Welcome! Are you a coach or an athlete?</h2>
          <div className="onboarding-role-choice">
            <button type="button" onClick={() => selectRole("coach")}>
              I&apos;m a Coach
            </button>
            <button type="button" onClick={() => selectRole("athlete")}>
              I&apos;m an Athlete
            </button>
          </div>
        </div>
      )}

      {step === 2 && role === "coach" && (
        <form className="onboarding-step onboarding-form" onSubmit={handleRoleDetailsSubmit}>
          <h2>Tell us about your team</h2>

          <label>
            Competitive level
            <select value={competitiveLevel} onChange={(e) => setCompetitiveLevel(e.target.value)}>
              {COMPETITIVE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label>
            Season start
            <input type="date" value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)} />
          </label>

          <label>
            Season end
            <input type="date" value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)} />
          </label>

          <label>
            Expected number of athletes
            <input
              type="number"
              min={1}
              value={athletesExpected}
              onChange={(e) => setAthletesExpected(e.target.value)}
            />
          </label>

          <label>
            Training days per week
            <input
              type="number"
              min={1}
              max={7}
              value={trainingDays}
              onChange={(e) => setTrainingDays(e.target.value)}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      )}

      {step === 2 && role === "athlete" && (
        <form className="onboarding-step onboarding-form" onSubmit={handleRoleDetailsSubmit}>
          <h2>Tell us about you</h2>

          <label>
            Position
            <select value={position} onChange={(e) => selectPosition(e.target.value)}>
              {POSITIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="onboarding-goals">
            <legend>Training goals (pick 1-2)</legend>
            {TRAINING_GOAL_OPTIONS.map((goal) => (
              <label key={goal} className="onboarding-goal-option">
                <input type="checkbox" checked={goals.includes(goal)} onChange={() => toggleGoal(goal)} />
                {goal}
              </label>
            ))}
          </fieldset>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      )}

      {step === 3 && role === "coach" && (
        <form className="onboarding-step onboarding-form" onSubmit={handleTeamStep}>
          <h2>Create your team</h2>
          <label>
            Team name
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="ex: Varsity Girls"
              required
            />
          </label>
          {teamError && (
            <p className="muted" role="alert">
              {teamError}
            </p>
          )}
          <button type="submit" disabled={!teamName.trim() || saving}>
            {saving ? "Creating..." : "Create Team"}
          </button>
        </form>
      )}

      {step === 3 && role === "athlete" && (
        <form className="onboarding-step onboarding-form" onSubmit={handleTeamStep}>
          <h2>Join your team</h2>
          <label>
            Invite code from your coach
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Invite code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={6}
              required
            />
          </label>
          {teamError && (
            <p className="muted" role="alert">
              {teamError}
            </p>
          )}
          <button type="submit" disabled={!inviteCode.trim() || saving}>
            {saving ? "Joining..." : "Join Team"}
          </button>
        </form>
      )}

      {step === 4 && (
        <div className="onboarding-step">
          <h2>You&apos;re all set!</h2>
          <p className="muted">
            {role === "coach"
              ? "Your team is ready. Share your invite code with athletes from the coach dashboard."
              : "You're on the roster. Your dashboard is ready."}
          </p>
          <button type="button" onClick={finish}>
            Go to {role === "coach" ? "Coach Dashboard" : "Dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}
