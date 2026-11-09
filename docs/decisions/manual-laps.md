# Manual laps fallback

**Decided:** 2026-11-09, before the Sprint 1–2 release.

**Choice:** laps come from rigs. If the SimHub overlay can't send them, logged-in users can type in their own laps at `/new`, behind one switch in the database that starts off.

**How it works**

- **The switch:** `public.app_settings.manual_laps_enabled`, a one-row table. Logged-in users can read it; nobody can change it through the API. Turn it on or off in the SQL editor (a data change, so the hosted dashboard's read-only rule for schema doesn't apply):

  ```sql
  update public.app_settings set manual_laps_enabled = true;  -- or false
  ```

  No redeploy needed: the next page load picks it up.

- **While it's on:** "Add lap" shows in the user menu (`UserSession.svelte`) and `/new` loads. While it's off, `/new` is a 404.
- **Storing a lap:** `public.insert_manual_lap`, called by `/new`'s action. The `lap_time` table stays locked (`lock_down_manual_laps`); the function is the only way in. It takes the driver from the login (`auth.uid()`), checks the switch itself, and uses the same duplicate key as the rig's `insert_lap`. It answers `created`, `duplicate`, `disabled` or `sectors_mismatch`.
- **The form:** game (preselected when the catalog has one), track, make, then model filtered by make, the lap time, and optional sectors. The user types S1 and S2; S3 is the rest of the lap. Sectors are all three or none.

**Telling manual laps apart:** a manual lap has no `rig_id` (and no `session_id`). Rig laps always have one, and the manual laps already in `prod` from the old "+" entry have none too. No `source` column; a future filter can use `rig_id is null`.

**Why**

- If an overlay breaks on a race day, building a fallback then would take too long.
- A database switch, not an env var: the database enforces it, so "off" is off even for someone calling the API directly, and turning it on needs no Vercel redeploy.
- A function, not an insert policy: a policy would let the client set every other column (`rig_id`, `session_id`, `for_testing`, `tournament_id`, `created_at`).
- Sectors are optional because people may only see the lap time. Computing S3 means the sectors always add up, with less typing.

**Note:** the game picker only records `lap_time.game_id`; cars and tracks aren't linked to a game. Rig laps leave `game_id` empty.
