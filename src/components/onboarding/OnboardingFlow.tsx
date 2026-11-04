"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { GuardianFields } from "@/components/guardian/GuardianFields";
import {
  EMPTY_GUARDIAN_ANSWER,
  fieldsFromSignupMetadata,
  SIGNUP_AGE_KEY,
  validateGuardianAnswer,
  type GuardianAnswer,
  type GuardianFields as AgeFields
} from "@/lib/guardian";
import { ATHLETE_GOALS, AthleteGoal, SPORTS, Sport, positionLabel } from "@/lib/athleteSignup";
import { createClient as createGuardianClient } from "@/lib/supabase/client";
import { POSITION_PROGRAMS } from "@/data/positionPrograms";
import { useProfile } from "@/hooks/useProfile";
import { useTrainingProfile } from "@/hooks/useTrainingProfile";
import { useTeam } from "@/hooks/useTeam";
import { pendingInviteFrom, PENDING_INVITE_KEY } from "@/lib/invite";
import { startingProgramKeyForPosition } from "@/lib/positionProgram";
import {
  INJURY_AREAS,
  InjuryArea,
  TRAINING_LEVELS,
  TrainingLevel
} from "@/lib/trainingProfile";
import { createClient } from "@/lib/supabase/client";

type Role = "coach" | "athlete";

const POSITIONS = ["Outside Hitter", "Middle Blocker", "Opposite", "Setter", "Libero/DS"];
const COMPETITIVE_LEVELS = ["Middle School", "JV", "Varsity", "Club", "College"];

const TOTAL_STEPS = 4;

export function OnboardingFlow() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const { setStartingProgram } = useTrackerContext();
  const { createTeam, joinTeam, error: teamError } = useTeam();
  const { setProfile: setTrainingProfile } = useTrainingProfile();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);

  const [teamName, setTeamName] = useState("");
  const [competitiveLevel, setCompetitiveLevel] = useState(COMPETITIVE_LEVELS[2]);
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [athletesExpected, setAthletesExpected] = useState("");
  const [trainingDays, setTrainingDays] = useState("");
  const [guardian, setGuardian] = useState<GuardianAnswer>(EMPTY_GUARDIAN_ANSWER);
  // Age and parent consent given on the sign-up screen (N-03). Null means
  // onboarding asks: Google sign-in from the sign-in screen, or older accounts.
  const [signupAge, setSignupAge] = useState<AgeFields | null>(null);
  const [guardianError, setGuardianError] = useState<string | null>(null);

  const [sport, setSport] = useState<Sport>("volleyball");
  const [position, setPosition] = useState(POSITIONS[0]);
  const [otherPosition, setOtherPosition] = useState("");
  const [goal, setGoal] = useState<AthleteGoal>("jump");
  // Setup quiz (F-06): the plan adapts to these from the first workout.
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>("intermediate");
  const [soreAreas, setSoreAreas] = useState<InjuryArea[]>([]);
  const [solo, setSolo] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  // From an invite link (/join/<code>): this browser's saved code, else the
  // one stored on the account at sign-up.
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const autoJoinTried = useRef(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(PENDING_INVITE_KEY);
    } catch {
      // Storage blocked; the account copy below still works.
    }
    let storedAge: unknown = null;
    try {
      storedAge = JSON.parse(window.localStorage.getItem(SIGNUP_AGE_KEY) ?? "null");
    } catch {
      // Nothing usable stored.
    }
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setPendingInvite(pendingInviteFrom(stored, data.user?.user_metadata));
        setSignupAge(fieldsFromSignupMetadata(data.user?.user_metadata) ?? fieldsFromSignupMetadata(storedAge));
      });
  }, []);

  async function clearPendingInvite() {
    setPendingInvite(null);
    try {
      window.localStorage.removeItem(PENDING_INVITE_KEY);
    } catch {
      // Nothing to clear.
    }
    await createClient().auth.updateUser({ data: { pending_invite: null } });
  }

  // Athletes who came from an invite link join automatically at the team step.
  useEffect(() => {
    if (step !== 3 || role !== "athlete" || !pendingInvite || autoJoinTried.current) return;
    autoJoinTried.current = true;
    setInviteCode(pendingInvite);
    setSaving(true);
    joinTeam(pendingInvite).then(async (ok) => {
      setSaving(false);
      if (ok) {
        await clearPendingInvite();
        setStep(4);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, role, pendingInvite]);

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


  async function handleRoleDetailsSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    // Athletes who didn't give their age at sign-up answer it here; under 13
    // needs a parent's consent before going on (N-03).
    const guardianResult =
      role !== "athlete" ? null : signupAge ? ({ ok: true, fields: signupAge } as const) : validateGuardianAnswer(guardian);
    if (guardianResult && !guardianResult.ok) {
      setGuardianError(guardianResult.error);
      return;
    }
    setGuardianError(null);
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
      const ageFields = guardianResult?.ok ? guardianResult.fields : null;
      setTrainingProfile({ level: trainingLevel, injuries: soreAreas, ageGroup: ageFields?.age_group ?? null });
      await updateProfile({
        position: positionLabel(sport, position, otherPosition),
        training_goals: [ATHLETE_GOALS.find((option) => option.value === goal)!.label]
      });
      // The plan is assigned from the answers: a volleyball position gets its
      // starting program, every other sport the all-round plan. Saved
      // separately so a missing column can't block the answers above. A coach
      // program still replaces it.
      await setStartingProgram(sport === "volleyball" ? startingProgramKeyForPosition(position) : null);
      if (ageFields) {
        // Separate write: before schema_v61 these columns don't exist, and
        // that mustn't block onboarding. The athlete is asked again on Today.
        const { data } = await createGuardianClient().auth.getUser();
        if (data.user) {
          const { error } = await createGuardianClient()
            .from("profiles")
            .upsert({ user_id: data.user.id, sport, ...ageFields }, { onConflict: "user_id" });
          if (error) console.error("Failed to save age and sport", error);
          else {
            try {
              window.localStorage.removeItem(SIGNUP_AGE_KEY);
            } catch {
              // Nothing to clear.
            }
          }
        }
      }
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
    if (ok && role === "athlete" && pendingInvite) await clearPendingInvite();
    if (ok) setStep(4);
  }

  function trainSolo() {
    setSolo(true);
    setStep(4);
  }

  function toggleSoreArea(area: InjuryArea) {
    setSoreAreas((current) => (current.includes(area) ? current.filter((item) => item !== area) : [...current, area]));
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
          {pendingInvite && (
            <p className="muted onboarding-invite-note">
              You&apos;re joining a team from an invite link. Choose &quot;I&apos;m an Athlete&quot; and you&apos;ll be added
              at the end.
            </p>
          )}
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

          {!signupAge && <GuardianFields value={guardian} onChange={setGuardian} idPrefix="onboarding-guardian" />}

          <fieldset className="onboarding-quiz">
            <legend>Sport</legend>
            <div className="filter-row">
              {SPORTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={sport === option.value ? "" : "ghost"}
                  aria-pressed={sport === option.value}
                  onClick={() => setSport(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {sport === "volleyball" ? (
            <>
              <label>
                Position
                <select value={position} onChange={(e) => setPosition(e.target.value)}>
                  {POSITIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {startingProgramKeyForPosition(position) && (
                <p className="muted">
                  You&apos;ll start on the {POSITION_PROGRAMS[startingProgramKeyForPosition(position)!].label} program:{" "}
                  {POSITION_PROGRAMS[startingProgramKeyForPosition(position)!].focus}
                </p>
              )}
            </>
          ) : (
            <label>
              Position (optional)
              <input
                value={otherPosition}
                onChange={(e) => setOtherPosition(e.target.value)}
                placeholder="ex: Point guard, Sprinter"
                maxLength={40}
              />
            </label>
          )}

          <fieldset className="onboarding-quiz">
            <legend>Level</legend>
            <div className="filter-row">
              {TRAINING_LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={trainingLevel === option.value ? "" : "ghost"}
                  aria-pressed={trainingLevel === option.value}
                  title={option.hint}
                  onClick={() => setTrainingLevel(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="muted">{TRAINING_LEVELS.find((option) => option.value === trainingLevel)?.hint}</p>
          </fieldset>

          <fieldset className="onboarding-quiz">
            <legend>Main goal</legend>
            <div className="filter-row">
              {ATHLETE_GOALS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={goal === option.value ? "" : "ghost"}
                  aria-pressed={goal === option.value}
                  onClick={() => setGoal(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="onboarding-quiz">
            <legend>Any injuries or sore spots? (optional)</legend>
            <div className="filter-row">
              {INJURY_AREAS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={soreAreas.includes(option.value) ? "" : "ghost"}
                  aria-pressed={soreAreas.includes(option.value)}
                  onClick={() => toggleSoreArea(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="muted">Your workouts swap to joint-friendly versions and add rehab work. Change it any time.</p>
          </fieldset>

          {guardianError && (
            <p className="guardian-error" role="alert">
              {guardianError}
            </p>
          )}

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
          <h2>Join your team, or train solo</h2>
          {pendingInvite && saving && <p className="muted">Joining your team from the invite link…</p>}
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

          <div className="onboarding-solo">
            <p className="muted">No team or no code? NextRep works on your own: your plan, check-ins and progress.</p>
            <button type="button" className="secondary" onClick={trainSolo} disabled={saving}>
              Train solo
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="onboarding-step">
          <h2>You&apos;re all set!</h2>
          <p className="muted">
            {role === "coach"
              ? "Your team is ready. Share your invite code with athletes from the coach dashboard."
              : solo
                ? "Your plan is set up around you. Start today's workout from the dashboard, and join a team any time."
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
