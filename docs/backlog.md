# Backlog

Items deferred from sprints. Each one notes where it came from.

## Code

- **Convert remaining JS to TS** (from Sprint 0, C2). Out of scope for Sprint 0.
  - `src/lib/store.js`: the `title` store.
  - `src/hooks.js`: the paraglide `reroute` hook (outside `src/lib`, listed for completeness).

- **Driver progress tab** (removed from the profile page on 2026-11-09). The profile had a "Progress" tab with an area chart (`DriverChart.svelte`), but it only showed shadcn's sample data (desktop/mobile visitors), never the driver's laps. The tab, the component and the `driver_profile_progress` string were removed; the shadcn chart component and `layerchart` stay (the lounge tachometer uses them). To bring it back: decide what "progress" means (e.g. best lap per track over time, or the last N laps on one car/track), add a query in `$lib/queries/driver.ts`, and a tab on `/driver/[slug]` next to Latest laps and Stats.

- **Tournaments page** (from Sprint 0, S3). `/tournaments` renders only the nav, so its nav item was disabled on 2026-11-09 (`disabled: true` in `menuItems`, `Nav.svelte`: half opacity, not clickable). Enable it with the page. The seed has a tournament with participants and tracks ready for it. On the roadmap, after Sprints 0 and 1, as its own sprint or alongside realtime.

## Auth

- **Match the hosted magic-link template** (from Sprint 0, S3; review at Sprint 0 end). Local templates in `supabase/templates/` link to `{{ .SiteURL }}/login/confirm?token_hash={{ .TokenHash }}&type=email`. Check the hosted Auth → Email Templates use the same link, and copy any wording over so local and prod emails match.

## Tooling

- **Migrations on merge to `prod`** (Sprint 0, S7; Decision 4). Releases run `supabase db push` by hand for now. Automate with a GitHub Action after a few manual releases.

## Database

- **Pole rating for unclaimed laps** (from Sprint 1, A0; before Sprint 3 claiming). `pole_rating` gives a track record +1 for every later lap by _another_ driver that doesn't beat it; a driver's own laps never count, so nobody can boost their record with slow laps. `update_pole_rating` runs on insert and compares `driver_id`s, so an unclaimed lap (`driver_id` null) never counts, now or later.
  - **Intended:** an unclaimed lap updates the pole rating only when it is claimed, because only then is it known whose it is and the same-driver rule can apply. Claiming runs the same check as an insert: if the lap's track record belongs to someone else (and the lap doesn't beat it), the record gets +1.
  - Open: which record counts, the one at the time the lap was driven or the one at claim time.
