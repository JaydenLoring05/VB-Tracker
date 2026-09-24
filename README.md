# NextRep

NextRep is a Next.js and TypeScript athlete training-and-recovery operating system built for volleyball teams.

## Live Demo

https://vercel.com/loringjayden-coders-projects/volleyball-tracker

## Features

- 20-week volleyball workout tracker
- Weekly training phases
- Workout completion tracking
- Recovery score
- Rule-based recovery recommendations
- Stats history
- Progress graphs
- Exercise library
- Calendar and training load preview
- Account sign-up/login and per-user cloud data (Supabase)
- Workout Mode: start a session, log sets with a rest timer, get a finish-of-workout summary
- Coach/Team layer: create or join a team by invite code, coaches get a
  read-only roster view with recovery scores, check-in flags, and a
  drill-down into each athlete's full stats history
- Phase-based 20-week program (Foundation/Build/Power/Taper) with real
  exercise variety per phase, not a single template repeated for 20 weeks
- Exercise substitution: swap any exercise for a curated alternative or
  another exercise in the same category, remembered across sessions
- Exercise library tagged by Beginner/Intermediate/Advanced, including
  hip-abduction, single-leg balance, and landing-mechanics work

## Tech Stack

- Next.js (App Router)
- TypeScript
- React
- Recharts
- CSS
- Supabase (Auth + Postgres)

## Setup

1. `npm install`
2. Create a Supabase project, then create `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```
3. Run every file in `supabase/`, once each, in your project's SQL Editor, in this order, to create the tables, row-level security policies, and constraints: `schema.sql`, `schema_v18_5.sql`, `schema_v19.sql`, `schema_v20_teams.sql`, `schema_v21_substitutions.sql`, `schema_v22_profiles.sql`, `schema_v23_team_management.sql`, `schema_v24_performance_profiles.sql`, `schema_v25_removal_notices.sql`, `schema_v26_multi_team_coach.sql`, `schema_v27_team_plan_tier.sql`, `schema_v28_team_exercise_defaults.sql`, `schema_v29_team_day_overrides.sql`, `schema_v30_workout_active_time.sql`, `schema_v31_readiness_expansion.sql`, `schema_v32_workout_rpe.sql`, `schema_v33_team_calendar.sql`, `schema_v34_profile_onboarding.sql`.
4. `npm run dev`

Run the unit tests with `npm test`; see [TESTING.md](TESTING.md) for what is covered.

## Purpose

This project was built to help track volleyball performance, jump training, recovery, and consistency while also serving as a full-stack-ready portfolio project.
