# Release flow

**Decided:** Sprint 0 (S6).

**Choice**

- Work happens on `chore/*` branches. Finished work moves to `preview`.
- `prod` stays untouched for now.
- `supabase db push` is allowed only for migrations that break nothing in prod, checked with `--dry-run` first. Anything else stays local until its code ships.

**Why**

- `preview` no longer has the manual "add lap" form, and the rig flow that replaces it isn't ready. If `preview` reached `prod`, prod users couldn't add laps.
- Both branches share one hosted database, so a migration that `preview` needs but `prod` can't handle would break prod.
