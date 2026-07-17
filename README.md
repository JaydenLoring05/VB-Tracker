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
- Coach/Team layer: create or join a team by invite code, and coaches get a
  read-only roster view with recovery scores and check-in flags

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
3. Run `supabase/schema.sql`, then `supabase/schema_v18_5.sql`, then `supabase/schema_v19.sql`, then `supabase/schema_v20_teams.sql`, once each in your project's SQL Editor to create the tables, row-level security policies, and constraints.
4. `npm run dev`

## Purpose

This project was built to help track volleyball performance, jump training, recovery, and consistency while also serving as a full-stack-ready portfolio project.
