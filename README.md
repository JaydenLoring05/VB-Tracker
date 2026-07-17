# Volleyball Tracker

A Next.js and TypeScript athlete tracking app built for volleyball training, recovery, stats, and performance monitoring.

## Live Demo

https://vercel.com/loringjayden-coders-projects/volleyball-tracker

## Features

- 20-week volleyball workout tracker
- Weekly training phases
- Workout completion tracking
- Recovery score
- AI-style recovery recommendations
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
3. Run `supabase/schema.sql`, then `supabase/schema_v18_5.sql`, then `supabase/schema_v19.sql`, then `supabase/schema_v20_teams.sql`, then `supabase/schema_v21_substitutions.sql`, once each in your project's SQL Editor to create the tables, row-level security policies, and constraints.
4. `npm run dev`

## Purpose

This project was built to help track volleyball performance, jump training, recovery, and consistency while also serving as a full-stack-ready portfolio project.
