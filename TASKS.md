# Tasks

- [ ] **Film tags v2**

  > **Blocker, flag before starting:** this spec builds on a "film feature"
  > (`supabase/schema_v35_team_film.sql`, a `film_tags` table, a
  > `useTeamFilm` hook, `src/lib/tagMeta.ts`, `is_team_coach`-based RLS, and
  > a base tagging UI with 8 tag types — set, kill, ace, block, dig, error,
  > serve_error, note) that does not exist yet anywhere in this repo
  > (checked `main`, all local/remote branches, and stale worktrees — none
  > of it is there). Build that v1 film feature first, on its own
  > branch/PR, before starting v2 below.

  Build "film tags v2" on a new branch `film-tags-v2` off latest `main`.
  Follow existing patterns from the film feature (`useTeamFilm`,
  `tagMeta.ts`, `schema_v35_team_film.sql`, `is_team_coach` RLS).

  GOAL: every film tag records WHO made the play and HOW GOOD it was, and
  tagging is fast enough to do a full match in about 15 minutes.

  1. `supabase/schema_v36_film_tag_details.sql` (safe to re-run):
     - Add to `film_tags`:
       - `athlete_id` uuid, nullable, referencing `auth.users`, on delete
         set null
       - `pass_rating` smallint, nullable, 0-3
       - `set_zone` text, nullable, in `('1','2','3','4','5','6')`
       - `set_type` text, nullable, in
         `('4','5','slide','pipe','back_row','quick','dump')`
       - `block_outcome` text, nullable, in
         `('stuff','touch','tooled','missed')`
       - `attack_direction` text, nullable, in
         `('line','cross','seam','tip','roll')`
     - Replace the tag check constraint so it also allows `'pass'` (keep
       all 8 existing values).
     - Enforce that `athlete_id`, if set, is a member of
       `film_tags.team_id` (a trigger using `team_members`).
     - Add index on `film_tags (team_id, athlete_id)`.

  2. Types: update `FilmTag` and `FilmTagType`. Add `'pass'` to
     `TAG_TYPES` and `TAG_LABELS`.

  3. Tagging UI (coach only):
     - Clicking a tag button opens an inline detail panel instead of
       saving immediately. It holds:
       - Athlete picker from the team roster. Reuse the hook the coach
         dashboard uses to list athletes.
       - Contextual fields: pass → 0/1/2/3. set → zone 1-6 plus set type.
         block → outcome. kill/error/ace → attack direction.
       - The note field and a Save button.
     - The athlete selection persists between tags.
     - The timestamp is captured the moment the tag button is pressed,
       not at save.

  4. KEYBOARD TAGGING (`src/lib/filmHotkeys.ts`, pure logic, unit tested):
     - Tag keys: P pass, S set, K kill, A ace, B block, D dig, E error, V
       serve error, N note.
     - Detail keys after a tag key:
       - Pass: 0/1/2/3 = rating, then auto-save.
       - Set: 1-6 = zone, then optional set type (Q quick, F four, I
         pipe, L slide).
       - Block: 1 stuff, 2 touch, 3 tooled, 4 missed.
       - Kill/error/ace: L line, C cross, M seam, T tip, R roll.
       - Enter saves early. Esc cancels.
     - Athlete: `[` and `]` cycle through the roster, or type a jersey
       number if the roster has one (otherwise use roster order 1-9 with
       Alt+number).
     - Video: Space play/pause, ←/→ seek 5s, Shift+←/→ seek 1s, Ctrl+Z
       undo the last tag.
     - Ignore hotkeys while typing in an input or textarea.
     - The YouTube iframe steals keyboard focus when clicked. Add a
       transparent focus-catcher or return focus to the page after
       player clicks so hotkeys keep working.
     - Show a "?" overlay listing all shortcuts, and a small on-screen
       hint showing the pending key sequence (e.g. "Pass → rating?").

  5. VOICE TAGGING (`src/lib/filmVoice.ts` parser, unit tested):
     - Use the browser Web Speech API (SpeechRecognition/
       webkitSpeechRecognition). Hide the mic button in unsupported
       browsers.
     - A mic toggle button, plus hold Backquote (`` ` ``) as push-to-talk
       (not V — that's serve error).
     - Capture the video time when speech STARTS, not when it ends.
     - A deterministic parser, no AI. It fuzzy-matches athlete first
       names from the roster and understands phrases like: "Jayden kill
       cross", "Maya pass two", "pass three", "set zone four slide",
       "block stuff", "Chris ace", "serve error", "dig", "note bad
       transition".
     - Number words and digits both work.
     - If no athlete is said, use the currently selected athlete.
     - After parsing, show a toast like "Kill · Cross · Jayden @ 3:42"
       with Undo (5s). If it can't parse, show what it heard and save
       nothing.
     - Write unit tests for at least 15 phrases, including misheard
       names and missing details.

  6. Tag list: show the athlete and details (e.g. "Pass · 3 · Jayden",
     "Set · Zone 4 · Slide"). Add an athlete filter dropdown next to the
     tag filter chips.

  7. Athletes stay read-only: no hotkeys, no mic, no tag panel. Verify
     RLS still blocks athlete writes.

  8. Run the unit tests, `npx tsc --noEmit`, and `npm run build`. Fix
     only what you introduced.

  9. Print `schema_v36_film_tag_details.sql` and stop. Tell the user to
     run it, and wait.

  10. After confirmation: run `npm run dev` and give a test checklist
      covering mouse tagging, every hotkey path, voice tagging (5
      phrases), undo, athlete filter, and athlete read-only view. Wait
      for results, then push and open a PR to `main`. Don't merge.
