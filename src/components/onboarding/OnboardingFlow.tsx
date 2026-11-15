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
import {
  EQUIPMENT,
  Equipment,
  equipmentNote,
  goalLabels,
  levelForYearsLifting,
  onboardingSteps,
  OnboardingStep,
  quizToRow,
  SEASON_PHASES,
  SeasonPhase,
  secondaryGoalOptions,
  validateSeasonDates,
  weeklyWithPracticeDays,
  YEARS_LIFTING,
  YearsLifting
} from "@/lib/onboardingQuiz";
import { createClient as createGuardianClient } from "@/lib/supabase/client";
import { POSITION_PROGRAMS } from "@/data/positionPrograms";
import { useProfile } from "@/hooks/useProfile";
import { useTrainingProfile } from "@/hooks/useTrainingProfile";
import { useTeam } from "@/hooks/useTeam";
import { pendingInviteFrom, PENDING_INVITE_KEY } from "@/lib/invite";
import { startingProgramKeyForPosition } from "@/lib/positionProgram";
import { INJURY_AREAS, InjuryArea, TRAINING_LEVELS, WEEKDAYS, Weekday } from "@/lib/trainingProfile";
import { createClient } from "@/lib/supabase/client";

type Role = "coach" | "athlete";

const POSITIONS = ["Outside Hitter", "Middle Blocker", "Opposite", "Setter", "Libero/DS"];
const COMPETITIVE_LEVELS = ["Middle School", "JV", "Varsity", "Club", "College"];

export function OnboardingFlow() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const { setStartingProgram } = useTrackerContext();
  const { createTeam, joinTeam, error: teamError } = useTeam();
  const { profile: savedTrainingProfile, setProfile: setTrainingProfile } = useTrainingProfile();

  const [step, setStep] = useState<OnboardingStep>("role");
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
  // Setup quiz (F-06, P-03): the plan adapts to these from the first workout.
  const [soreAreas, setSoreAreas] = useState<InjuryArea[]>([]);
  const [ageFields, setAgeFields] = useState<AgeFields | null>(null);
  const [yearsLifting, setYearsLifting] = useState<YearsLifting>("1to2");
  const [equipment, setEquipment] = useState<Equipment>("fullGym");
  const [secondaryGoal, setSecondaryGoal] = useState<AthleteGoal | null>(null);
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>("offSeason");
  const [practiceDays, setPracticeDays] = useState<Weekday[]>([]);
  const [seasonError, setSeasonError] = useState<string | null>(null);
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
    if (step !== "team" || role !== "athlete" || !pendingInvite || autoJoinTried.current) return;
    autoJoinTried.current = true;
    setInviteCode(pendingInvite);
    setSaving(true);
    joinTeam(pendingInvite).then(async (ok) => {
      setSaving(false);
      if (ok) {
        await clearPendingInvite();
        setStep("done");
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
    setStep("details");
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
      setSaving(false);
      setStep("team");
      return;
    }

    // Athletes answer the quiz (P-03) before anything is saved.
    setAgeFields(guardianResult?.ok ? guardianResult.fields : null);
    setSaving(false);
    setStep("training");
  }

  function handleTrainingSubmit(event: FormEvent) {
    event.preventDefault();
    setStep("season");
  }

  async function handleSeasonSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const dateError = validateSeasonDates(seasonStart, seasonEnd);
    if (dateError) {
      setSeasonError(dateError);
      return;
    }
    setSeasonError(null);
    setSaving(true);

    setTrainingProfile({
      level: levelForYearsLifting(yearsLifting),
      injuries: soreAreas,
      ageGroup: ageFields?.age_group ?? null,
      weekly: weeklyWithPracticeDays(savedTrainingProfile.weekly ?? {}, practiceDays)
    });
    await updateProfile({
      position: positionLabel(sport, position, otherPosition),
      training_goals: goalLabels(goal, secondaryGoal),
      season_start: seasonStart || null,
      season_end: seasonEnd || null
    });
    // The plan is assigned from the answers: a volleyball position gets its
    // starting program, every other sport the all-round plan. Saved
    // separately so a missing column can't block the answers above. A coach
    // program still replaces it.
    await setStartingProgram(sport === "volleyball" ? startingProgramKeyForPosition(position) : null);
    const { data } = await createGuardianClient().auth.getUser();
    if (data.user) {
      if (ageFields) {
        // Separate write: before schema_v61 these columns don't exist, and
        // that mustn't block onboarding. The athlete is asked again on Today.
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
      // Separate write too: before schema_v66 these columns don't exist.
      const { error: quizError } = await createGuardianClient()
        .from("profiles")
        .upsert(
          { user_id: data.user.id, ...quizToRow({ yearsLifting, equipment, seasonPhase }) },
          { onConflict: "user_id" }
        );
      if (quizError) console.error("Failed to save quiz answers", quizError);
    }

    setSaving(false);
    setStep("team");
  }

  async function handleTeamStep(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    const ok = role === "coach" ? await createTeam(teamName.trim()) : await joinTeam(inviteCode.trim());

    setSaving(false);
    if (ok && role === "athlete" && pendingInvite) await clearPendingInvite();
    if (ok) setStep("done");
  }

  function trainSolo() {
    setSolo(true);
    setStep("done");
  }

  function toggleSoreArea(area: InjuryArea) {
    setSoreAreas((current) => (current.includes(area) ? current.filter((item) => item !== area) : [...current, area]));
  }

  function pickGoal(next: AthleteGoal) {
    setGoal(next);
    if (secondaryGoal === next) setSecondaryGoal(null);
  }

  function togglePracticeDay(day: Weekday) {
    setPracticeDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  const steps = onboardingSteps(role);

  function finish() {
    router.push(role === "coach" ? "/coach" : "/dashboard");
  }

  return (
    <div className="panel onboarding-flow" ref={flowRef}>
      <p className="muted onboarding-step-indicator">
        {role ? `Step ${steps.indexOf(step) + 1} of ${steps.length}` : "Step 1"}
      </p>

      {step === "role" && (
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

      {step === "details" && role === "coach" && (
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

      {step === "details" && role === "athlete" && (
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

      {step === "training" && role === "athlete" && (
        <form className="onboarding-step onboarding-form" onSubmit={handleTrainingSubmit}>
          <h2>Your training</h2>

          <fieldset className="onboarding-quiz">
            <legend>How long have you been lifting?</legend>
            <div className="filter-row">
              {YEARS_LIFTING.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={yearsLifting === option.value ? "" : "ghost"}
                  aria-pressed={yearsLifting === option.value}
                  onClick={() => setYearsLifting(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="muted">
              You&apos;ll start at {TRAINING_LEVELS.find((option) => option.value === levelForYearsLifting(yearsLifting))?.label}{" "}
              level. Change it any time on Workouts.
            </p>
          </fieldset>

          <fieldset className="onboarding-quiz">
            <legend>What can you train with?</legend>
            <div className="filter-row">
              {EQUIPMENT.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={equipment === option.value ? "" : "ghost"}
                  aria-pressed={equipment === option.value}
                  onClick={() => setEquipment(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="muted">
              {EQUIPMENT.find((option) => option.value === equipment)?.hint}
              {equipmentNote(equipment) ? `. ${equipmentNote(equipment)}` : ""}
            </p>
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
                  onClick={() => pickGoal(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="onboarding-quiz">
            <legend>Second goal (optional)</legend>
            <div className="filter-row">
              {secondaryGoalOptions(goal).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={secondaryGoal === option.value ? "" : "ghost"}
                  aria-pressed={secondaryGoal === option.value}
                  onClick={() => setSecondaryGoal(secondaryGoal === option.value ? null : option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="onboarding-actions">
            <button type="button" className="ghost" onClick={() => setStep("details")}>
              Back
            </button>
            <button type="submit">Continue</button>
          </div>
        </form>
      )}

      {step === "season" && role === "athlete" && (
        <form className="onboarding-step onboarding-form" onSubmit={handleSeasonSubmit}>
          <h2>Your season</h2>

          <fieldset className="onboarding-quiz">
            <legend>Where are you in your season?</legend>
            <div className="filter-row">
              {SEASON_PHASES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={seasonPhase === option.value ? "" : "ghost"}
                  aria-pressed={seasonPhase === option.value}
                  onClick={() => setSeasonPhase(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="muted">{SEASON_PHASES.find((option) => option.value === seasonPhase)?.hint}</p>
          </fieldset>

          <label>
            Season start (optional)
            <input type="date" value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)} />
          </label>

          <label>
            Season end (optional)
            <input type="date" value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)} />
          </label>

          <fieldset className="onboarding-quiz">
            <legend>Which days do you have practice? (optional)</legend>
            <div className="filter-row">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={practiceDays.includes(day) ? "" : "ghost"}
                  aria-pressed={practiceDays.includes(day)}
                  aria-label={day}
                  onClick={() => togglePracticeDay(day)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="muted">Practice days get no extra jumping, so your legs stay fresh.</p>
          </fieldset>

          {seasonError && (
            <p className="guardian-error" role="alert">
              {seasonError}
            </p>
          )}

          <div className="onboarding-actions">
            <button type="button" className="ghost" onClick={() => setStep("training")} disabled={saving}>
              Back
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>
      )}

      {step === "team" && role === "coach" && (
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

      {step === "team" && role === "athlete" && (
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

      {step === "done" && (
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
