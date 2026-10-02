# Testing

Unit tests use [Vitest](https://vitest.dev). They run in plain Node, need no
`.env` file, and never touch the network or a real Supabase project (the
Supabase clients are mocked). The whole suite runs in about a second.

## Run

```
npm test            # single run (what CI runs)
npm run test:watch  # re-run on save
npx vitest run tests/lib/recovery.test.ts   # one file
```

Before opening a PR, all of these must pass (CI runs the same steps in
`.github/workflows/ci.yml`):

```
npx tsc --noEmit
npm run lint       # ESLint flat config in eslint.config.mjs; warnings are allowed, errors fail
npm test
npm run build      # needs NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY set; any placeholder works
```

## End-to-end smoke test

`e2e/demo.spec.ts` opens the public `/demo` page in Chromium against a production build and checks that the sample
roster and the Attention Center render. It needs no account or secrets. CI runs it as a separate `e2e` job.

```
npx playwright install chromium   # once
npm run build
npm run test:e2e
```

## What is covered

Tests live under `tests/`, mirroring `src/`.

| Area | Test file | Notes |
| --- | --- | --- |
| Pilot form validation | `tests/lib/pilotApplication.test.ts` | Field rules, normalization, control characters |
| `POST /api/pilot` | `tests/api/pilotRoute.test.ts` | Valid input, bad email, honeypot, oversize body, cross-origin, duplicate email, missing table, DB flood guard, per-IP rate limit |
| Team setup checklist | `tests/lib/teamSetup.test.ts` | `computeSetupProgress` combinations, share messages |
| Attention Center | `tests/lib/attentionCenter.test.ts` | Pain streaks, readiness drop, missed workouts, PRs, ranking |
| Readiness scoring | `tests/lib/recovery.test.ts` | Score weights, status thresholds, severe-pain guardrail, recommendations |
| Program resolution | `tests/lib/programResolution.test.ts` | Phase boundaries, pilot vs paid overrides, substitutions |
| Auth, DB error and date helpers | `tests/lib/smallHelpers.test.ts` | Dead-session detection, user-facing errors, `todayISO`, `formatLastActive` |
| Personal records | `tests/lib/personalRecord.test.ts` | First-ever set, ties, heavier set, longer hold, weighted timed sets, null inputs, PR board labels |
| Training load | `tests/lib/trainingLoad.test.ts` | Personal and team event weights, 7-day window edges, no double count when a session is on both calendars |
| Adherence summary | `tests/hooks/summarizeAdherence.test.ts` | Minutes, completion percent, cap at 100 |
| Demo data | `tests/data/demoData.test.ts` | Deterministic, no missing fields, sane ranges, storylines hold every weekday; demo films embed, tags use roster athletes and valid details; demo workout has last week's numbers for every exercise |
| Workout plan and exercise library | `tests/data/workoutPlan.test.ts` | Every planned exercise exists in the library |
| `src/proxy.ts` | `tests/proxy.test.ts` | Public paths, `/demo`, signed-out redirect, dead-session cookie clearing, matcher exclusions |
| `public/sw.js` | `tests/serviceWorker.test.ts` | Only static assets and `/offline` are cached; never HTML, Supabase or non-GET |

## What is not covered

- React components, pages and hooks that call Supabase (`useTeam`, `TrackerContext`, ...). They are UI or I/O
  glue; the logic worth testing has been kept in pure functions.
- Row-level security and SQL functions. These need a real Postgres; run them against a Supabase branch, not in unit tests.
- Browser behavior of the service worker (install prompts, real cache eviction) and signed-in end-to-end flows. The
  `scripts/playwright-verify` scripts cover those manually against a running app.

## Add a test

1. Put pure logic in `src/lib` (or `src/data`) so it can be imported without React or Supabase.
2. Create `tests/<same path as src>/<name>.test.ts` and import from the `@/` alias, same as app code:

   ```ts
   import { describe, expect, it } from "vitest";
   import { recoveryStatus } from "@/lib/recovery";

   describe("recoveryStatus", () => {
     it("calls 85 and above Elite", () => {
       expect(recoveryStatus(85).label).toBe("Elite");
     });
   });
   ```

3. Code that reads the clock: use `vi.useFakeTimers()` and `vi.setSystemTime(...)`, and restore in `afterEach`.
4. Code that talks to Supabase: `vi.mock("@supabase/supabase-js", ...)` (or `@supabase/ssr`) with a fake client, as in
   `tests/api/pilotRoute.test.ts` and `tests/proxy.test.ts`. A test must never make a real request.
5. Write the test first and watch it fail before making it pass.
