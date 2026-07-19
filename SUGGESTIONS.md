# Suggestions

Things noticed while working through the app that weren't in scope for this
pass, but are worth considering next. Grounded in what's actually in the
codebase, not generic advice.

## Data / content

- **A handful of substitution hints in `src/data/exercises.ts` still don't
  resolve to a catalog entry** (e.g. "Lat Pulldown", "Romanian Deadlift",
  "Glute Bridge" variants). Most-referenced typos were fixed already;
  writing full catalog entries for the remaining recurring names would let
  the curated-substitution picker surface curated options instead of
  falling back to "same category" every time.

## Reliability

- **`useCoachRoster` has no pagination.** Fine for a volleyball team (dozens
  of athletes at most), but the roster/stats/profiles queries load everyone
  in one shot with no limit — worth revisiting only if this ever gets used
  for a much larger roster than a single team.
