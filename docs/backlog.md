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

- **`pnpm lint` fails on line endings** (from Sprint 0, S4). On Windows, `core.autocrlf=true` checks files out as CRLF while the index stores LF (`git ls-files --eol` shows `i/lf w/crlf`). Prettier defaults to `endOfLine: "lf"`, so `prettier --check .` flags ~260 files that are otherwise formatted. Fix: add `* text=auto eol=lf` to `.gitattributes` (keeping the `-text` rule for migrations), renormalize the working copy, then run `pnpm format` once and commit the result on its own. Best done with C4, so `lint` and `check` both start clean.

## Database

- **Anonymous avatar uploads** (from Sprint 0, S2). The storage policy "Anyone can upload an avatar." allows `INSERT` on the `avatars` bucket for role `public`, so visitors who aren't logged in can upload files. Restrict it to `authenticated`, and ideally to the user's own folder, in a new migration.
