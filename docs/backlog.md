# Backlog

Items deferred from sprints. Each one notes where it came from.

## Code

- **Convert remaining JS to TS** (from Sprint 0, C2). Out of scope for Sprint 0.
  - `src/lib/store.js`: the `title` store.
  - `src/hooks.js`: the paraglide `reroute` hook (outside `src/lib`, listed for completeness).

## Database

- **Anonymous avatar uploads** (from Sprint 0, S2). The storage policy "Anyone can upload an avatar." allows `INSERT` on the `avatars` bucket for role `public`, so visitors who aren't logged in can upload files. Restrict it to `authenticated`, and ideally to the user's own folder, in a new migration.
