# Tasks

Refreshed on Sunday 22 November 2026 to match `main`. The launch steps
(database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

Merged since 15 November: #128 (B-09), #129 (RF-02), #131 and #132
(Phase 1 #5 and #3). Stripe checkout checked by Jayden on 22 November: the
live Checkout session loads (no payment made).

## Open pull requests

| PR | What | Needs SQL | Waiting on |
| --- | --- | --- | --- |
| #134 | Phase 1 #2: first workout free, card at workout 2 | No | Your review and merge |
| #133 | Phase 1 #4: solo-first onboarding, team code optional | No | Your review and merge |
| #126 | P-03: onboarding quiz | **Yes**, `schema_v66_onboarding_quiz.sql` | Run the SQL, then merge |
| #135 | Phase 1 #1: Week 1 preview at the end of onboarding | No | Merge after #126 (both edit onboarding) |
| #130 | G-07: challenge weeks in the athlete's time zone | **Yes**, `schema_v66_challenge_time_zone.sql` | Run the SQL, then merge |
| #136 | P-06: read-only viewer link for a parent or coach | **Yes**, `schema_v67_viewer_links.sql` | Run the SQL, then merge |
| This PR | Docs: B-09 and RF-02 to Shipped; F-17, F-19, F-22, F-23, F-24 to Later | No | Your merge |

#137 (weekly housekeeping) also edits these two files and marks F-17, F-22,
F-23 and F-24 `building`. That goes against the demotion below, so merge
this PR and close #137, or rebase #137 onto this one.

The older feature PRs for the demoted rows (#75 F-23, #76 to #78 F-17,
#87 F-24, #101 F-22) stay open but parked until those rows are `planned`
again.

## Needs you

- [ ] Run `schema_v66_onboarding_quiz.sql`, `schema_v66_challenge_time_zone.sql`
      and `schema_v67_viewer_links.sql` in the Supabase SQL Editor before
      merging #126, #130 and #136.
- [ ] Launch checklist items still open: email setup (Resend,
      `CRON_SECRET`), `NEXT_PUBLIC_SENTRY_DSN`,
      `NEXT_PUBLIC_ANALYTICS_ENABLED`, the under-13 wording check, and the
      dry run with one coach and three athletes.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows that have no open PR; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| P-04 Season- and practice-adaptive plan | L | `planned` | Split before building |
| P-05 Test days | L | `planned` | Split before building |
| P-07 Public athletic resume, highlight video link, PDF export | M | `planned` | Next weekly update builds it |
| P-08 10-session and test-day badges, retest-day push reminders | S | `planned` | After P-07 |

## Later

Demoted on 22 November 2026 (Jayden approved, #36 B). They are `new` in
SUGGESTIONS.md and sit at the bottom of the backlog, so the weekly update
skips them until Jayden marks them `planned` again.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| F-17 Bring in a plan a coach already has | L | `new` | You to mark it `planned`; split before building |
| F-19 Supersets in coach-built programs | M | `new` | You to mark it `planned`; builds on F-23 |
| F-22 A coach's own exercises in the Exercise Library | M | `new` | You to mark it `planned`; needs SQL |
| F-23 Sections in a day, starting with a warm-up | M | `new` | You to mark it `planned`; F-19, F-24 and F-26 build on it |
| F-24 A day built from more than one program | M | `new` | You to mark it `planned`; builds on F-23 |
