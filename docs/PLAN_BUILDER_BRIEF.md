# Plan builder brief

A brief for a Claude Code session working in this repo. Written on
2026-10-10 after the onboarding call with NextRep's first founding pilot
coach. Read `CLAUDE.md` first and follow it; this file adds the context
for one piece of work.

## Situation

Taichi, the first pilot coach, built his own programs in the plan builder and
found it long and hard. Jayden wants planning to be as simple as possible
for any coach. Everything from the call, and from Taichi's three real
plans, is in `SUGGESTIONS.md`. Read these two blocks there before you
start. They are the spec.

- "Plan builder rows from Taichi's onboarding call"
- "What Taichi's three plans look like"

## Before you start

Check `main`. `SUGGESTIONS.md` should have rows F-16 to F-28. If it
doesn't, a backlog PR is still open: tell Jayden which one and stop.

## What to build

The `planned` plan builder rows, in table order. One PR per row, or per
numbered part where a row is split.

1. F-16: save each day
2. F-23: sections in a day, warm-up first
3. F-17: bring in an existing plan
4. F-18: a note on each exercise
5. F-24: a day built from more than one program (part 1 only)
6. F-28: max day (part 1; part 2 needs SQL, so it is its own PR)
7. F-19: supersets
8. F-22: a coach's own exercises in the Exercise Library (needs SQL)

Don't build F-20, F-26 or F-27. They are `new`.

## Things that matter

- **A coach does this on a phone between practices.** Fewer fields and
  fewer taps beat more options. Don't add a screen where a button on the
  existing one will do.
- **Sections are one model, not four features.** Warm-up, combined days,
  max tests, supersets and pick-one groups are all sections with a kind.
  Design F-23 so the later rows only add a kind or a control.
- **Stored programs stay compatible.** New fields in `team_programs.days`
  are optional. A day with no sections is one unnamed section.
  `parseProgramDays` keeps reading programs saved before today, and
  `programToWorkoutDays` keeps returning the flat list the rest of the app
  reads.
- **A per-day save must never put a half-built week in front of
  athletes.** A program that is already assigned keeps showing its last
  complete version until the coach finishes.
- **Every import shows a preview the coach can edit** before anything is
  added. Uploaded files are read in the browser and never stored. The
  Google Sheets link route accepts only `docs.google.com` spreadsheet
  links, runs for signed-in coaches, and has a size cap and a timeout.
- **Rows that need SQL must not break the app before the SQL is run.**
  `CustomProgramPanel` already handles "not set up"; follow that.

## Taichi's sheets

His three plans are Google Sheets shared by link, so each is readable as
CSV with no sign-in at
`https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv`. Jayden
gives you the three links in his message; they are not in this repo
because the repo is public. Check the F-17 reader against all three.

Build a made-up fixture in the same shape for the tests. Don't commit his
plans, his sheet links or his full name.

## Testing

The builder is behind sign-in. Test the editor on a throwaway page at
phone width in a real browser, and don't commit that page. Say in each PR
what you did and didn't check.

## Branches and merging

These rows all edit `CustomProgramPanel.tsx` and `customProgram.ts`. You
probably can't merge. Start each branch from the previous row's branch
when its PR is still open, and say in the PR what it carries. Don't try
to work around a blocked merge.

## When you finish or get stuck

Give Jayden:

- the PRs in order;
- which single PR to merge to ship everything so far;
- any SQL he needs to run;
- questions for him or for Taichi.
