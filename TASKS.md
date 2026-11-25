# Tasks

Refreshed on Sunday 22 November 2026 by the weekly update. The launch steps
(database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

Merged since 15 November: #128 (B-09), #129 (RF-02), #131 and #132
(Phase 1 #5 and #3). Stripe checkout checked by Jayden on 22 November: the
live Checkout session loads (no payment made). #138 (docs) merged.

## Merged, schema present (24 Nov 2026)

#126 (P-03), #130 (G-07) and #136 (P-06) are **merged** on GitHub (24 Nov,
05:06 to 05:12 UTC). Jayden ran `schema_v66_*` and `schema_v67_viewer_links.sql`
on 24 Nov. What is verified and what is only claimed:

| Feature | In the database | Status |
| --- | --- | --- |
| P-03 quiz | `profiles.years_lifting`, `equipment`, `season_phase` | **Seen** by a read-only Supabase check (relayed from ChatGPT, MSG-2026-11-24-016) |
| G-07 time zone | `profiles.time_zone` seen. `athlete_time_zone()` not checked | Column seen; function **claimed** (Jayden ran the SQL), not seen |
| P-06 viewer link | `viewer_links` table | **Seen** by the same check, and by Jayden's earlier check |

Not verified: the migration-history listing is empty, so it cannot confirm
which files ran. The check is by columns and tables only. Which Supabase
project the deployed app uses has not been matched yet (see PR #141).

## Open pull requests

### Ready now (merge cleanly into `main`)

| Order | PR | What | Needs SQL | Waiting on |
| --- | --- | --- | --- | --- |
| 1 | #134 | Phase 1 #2: first workout free, card at workout 2 | No | Your review and merge |
| 2 | #133 | Phase 1 #4: solo-first onboarding copy, team code optional | No | Your review and merge |
| 3 | #126 | P-03: onboarding quiz | **Yes**, `schema_v66_onboarding_quiz.sql` | **Merged 24 Nov (GitHub).** Schema seen in Supabase (see section above). Three questions in the PR |
| 4 | #135 | Phase 1 #1: Week 1 preview at the end of onboarding | No | Merge after #126: they both edit onboarding and conflict, so rebase whichever goes second |
| 5 | #130 | G-07: challenge weeks in the athlete's time zone | **Yes**, `schema_v66_challenge_time_zone.sql` | **Merged 24 Nov (GitHub).** Schema seen in Supabase (see section above) |
| 6 | #136 | P-06: read-only viewer link for a parent or coach | **Yes**, `schema_v67_viewer_links.sql` | **Merged 24 Nov (GitHub).** Schema seen in Supabase (see section above). Four questions in the PR |
| 7 | This PR | Housekeeping: this file and SUGGESTIONS.md | No | Your merge |

Two files are numbered v66 (#126 and #130). They don't touch the same
tables, so run both in either order; the numbers only look odd.

If #130 merges after this PR, it conflicts on one line of SUGGESTIONS.md
(the G-07 row). This PR already marks G-07 `building`; keep that line.

### Need a rebase first (conflict with `main`)

These are five to six weeks old and no longer merge cleanly. Each needs the
weekly update or you to rebase it before review.

| PR | Row | What |
| --- | --- | --- |
| #75 | F-23 (parked) | Sections in a day, warm-up written once |
| #76, #77, #78 | F-17 (parked) | Bring in a plan by paste, file, or Google Sheets link |
| #83 | F-28 | Weight targets as a percent of each athlete's max |
| #101 | F-22 (parked) | A coach's own exercises in the library (needs `schema_v59_team_exercises.sql`) |
| #74 | B-10 | Continue Workout reopens the workout in progress |

### Can be closed

- #73 (F-16): shipped in #81.
- #72, #86, #88, #102, #105, #123, #127: older weekly housekeeping PRs.
  This PR carries what they still had (the F-28 and B-10 rows). #127's
  F-17, F-22, F-23 and F-24 `building` marks were dropped: those rows are
  demoted to Later (#138).

## Needs you

- [x] `schema_v66_*` and `schema_v67_viewer_links.sql` ran on 24 Nov
      (columns and table seen; see "Merged, schema present").
- [ ] Mark the P-04 and P-05 parts `planned` (P-04a to P-04d, P-05a to
      P-05c). P-04 and P-05 are size L, so they were split and nothing was
      built from them.
- [ ] Decide on the old conflicting PRs above: rebase or close.
- [ ] Answer the questions in #126 and #136.
- [ ] Earlier items still open from the launch checklist: email setup
      (Resend, `CRON_SECRET`), `NEXT_PUBLIC_SENTRY_DSN`,
      `NEXT_PUBLIC_ANALYTICS_ENABLED`, the under-13 wording check, and the
      dry run with one coach and three athletes.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows that have no open PR; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| P-07 Public athletic resume, highlight video link, PDF export | M | `planned` | Next weekly update builds it |
| P-08 10-session and test-day badges, retest-day push reminders | S | `planned` | The update after P-07 (two rows are built only when the first is size S) |
| P-04a to P-05c | S-M | `new` | You to mark them `planned` |

## Later

Demoted on 22 November 2026 (Jayden approved, #36 B; merged in #138). They
are `new` in SUGGESTIONS.md and sit at the bottom of the backlog, so the
weekly update skips them until Jayden marks them `planned` again. Their old
feature PRs (#75 F-23, #76 to #78 F-17, #87 F-24, #101 F-22) stay open but
parked.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| F-17 Bring in a plan a coach already has | L | `new` | You to mark it `planned`; split before building |
| F-19 Supersets in coach-built programs | M | `new` | You to mark it `planned`; builds on F-23 |
| F-22 A coach's own exercises in the Exercise Library | M | `new` | You to mark it `planned`; needs SQL |
| F-23 Sections in a day, starting with a warm-up | M | `new` | You to mark it `planned`; F-19, F-24 and F-26 build on it |
| F-24 A day built from more than one program | M | `new` | You to mark it `planned`; builds on F-23 |
