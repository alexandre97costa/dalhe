# Backlog

Items deferred from sprints. Each one notes where it came from.

## Code

- **Convert remaining JS to TS** (from Sprint 0, C2). Out of scope for Sprint 0.
  - `src/lib/store.js`: the `title` store.
  - `src/hooks.js`: the paraglide `reroute` hook (outside `src/lib`, listed for completeness).

- **Tournaments page** (from Sprint 0, S3). `/tournaments` renders only the nav; the seed has a tournament with participants and tracks ready for it. On the roadmap, after Sprints 0 and 1, as its own sprint or alongside realtime.

## Auth

- **Match the hosted magic-link template** (from Sprint 0, S3; review at Sprint 0 end). Local templates in `supabase/templates/` link to `{{ .SiteURL }}/login/confirm?token_hash={{ .TokenHash }}&type=email`. Check the hosted Auth → Email Templates use the same link, and copy any wording over so local and prod emails match.

## Tooling

- **Migrations on merge to `prod`** (Sprint 0, S7; Decision 4). Releases run `supabase db push` by hand for now. Automate with a GitHub Action after a few manual releases.

## Database

- **Anonymous avatar uploads** (from Sprint 0, S2). The storage policy "Anyone can upload an avatar." allows `INSERT` on the `avatars` bucket for role `public`, so visitors who aren't logged in can upload files. Restrict it to `authenticated`, and ideally to the user's own folder, in a new migration.

- **Pole rating for unclaimed laps** (from Sprint 1, A0; before Sprint 3 claiming). `pole_rating` gives a track record +1 for every later lap by _another_ driver that doesn't beat it; a driver's own laps never count, so nobody can boost their record with slow laps. `update_pole_rating` runs on insert and compares `driver_id`s, so an unclaimed lap (`driver_id` null) never counts, now or later.
  - **Intended:** an unclaimed lap updates the pole rating only when it is claimed, because only then is it known whose it is and the same-driver rule can apply. Claiming runs the same check as an insert: if the lap's track record belongs to someone else (and the lap doesn't beat it), the record gets +1.
  - Open: which record counts, the one at the time the lap was driven or the one at claim time.
