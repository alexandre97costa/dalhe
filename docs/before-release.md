# Before the release

Everything that has to happen before `preview` goes to `prod`. This release carries Sprints 1, 1.5 and 2 together: the rig flow, the lounge, and rig access from the homepage. `prod` is still at the Sprint 0 state (PR #21).

Checked on 2026-11-06. Tick items as they're done; delete this file (or start a new one) after the release.

## Why this release is all at once

The hosted database has only the first 3 of 16 migrations (`supabase migration list --linked`). Two of the 13 pending ones change function signatures that the code on `prod` calls today, so they can't go out early:

| Migration                                           | Sprint | Breaks `prod`?                                                                                  |
| --------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `20261029002729_lock_down_rig_writes`               | 1      | **Yes.** `connect_to_rig` takes new arguments; client write policies on rig tables are dropped. |
| `20261029223121_rig_key`                            | 1      | No, but from then on the new rig endpoints require `?k=` (see Overlay).                         |
| `20261030000014_insert_lap_outcomes`                | 1      | **Yes.** `insert_lap` returns an outcome instead of an id.                                      |
| `20261030000440_rig_stats_upsert`                   | 1      | No (new function).                                                                              |
| `20261030214753_lounge_bests`                       | 1.5    | No (new function).                                                                              |
| `20261030214826_rig_qr_bucket`                      | 1.5    | No (new bucket).                                                                                |
| `20261105171322_lounge_driver_avatar`               | 1.5    | No (`rig_status` gains a column).                                                               |
| `20261106002555_rig_spectate`                       | 2      | No (nullable column, new function).                                                             |
| `20261106002557_my_rigs`                            | 2      | No (`rig_status` same signature; new functions).                                                |
| `20261106002559_user_tip`                           | 2      | No (new table).                                                                                 |
| `20261108202214_home_driver_avatar`                 | 2      | No (`get_my_rigs` gains a column; `prod` doesn't call it).                                      |
| `20261109103857_avatars_bucket_policies`            | —      | No (avatars bucket made public, upload limited to the user's own folder).                       |
| `20261109120531_profiles_username_case_insensitive` | —      | No, if hosted has no usernames that differ only in case (see section 2).                        |

So the database push and the `prod` deploy happen in one short window, and the overlay on every rig is updated in that same window (new endpoints need the rig key and the `rainIntensity` spelling).

## 1. App: what's left to build

- [ ] **"What's new" card.** One dismissible card on the homepage listing the two or three changes, reusing `user_tip` and `Tip.svelte` (new key in `$lib/config/tips.ts`, e.g. `whats_new_2026_11`). A small story of its own, written when the release contents are final (Sprint 2, Release).
- [ ] **Manual decisions** still open:
  - Sprint 2: anonymous session copy ("In use, no driver connected"), rig card visual (status colours), tip copy, Portuguese strings (first drafts).
  - Sprint 1.5: the open items in its Manual decisions, and whether an unclaimed lap faster than the record shows "Track Record".
- [ ] **Poll interval** for the overlay decided (`docs/sprints/rig-endpoints.md`, Open issue 6): it runs all day on some rigs.
- [ ] `feat/rig-access` merged into `preview`, and `preview` checked locally against a freshly reset database (`pnpm db:reset`, `pnpm exec supabase test db`, `pnpm check`, `pnpm build`).

## 2. Hosted data and settings (any time before the window)

These don't depend on the new schema and can be done ahead.

- [ ] **Usernames that differ only in case.** The `profiles_username_case_insensitive` migration fails if any exist. Check in the SQL editor: `select lower(username), count(*) from public.profiles where username is not null group by 1 having count(*) > 1;` must return no rows. Rename any clash first.

- [ ] **SimHub ids.** 19 cars and 8 tracks have no SimHub id in hosted (Sprint 1.5, X4). Fill them in the SQL editor (data change, allowed); `pnpm simhub:check` lists what's missing. Without them, the lounge shows humanized ids and no bests for those cars and tracks.
- [ ] **Magic-link email template.** Hosted Auth → Email Templates should link to `{{ .SiteURL }}/login/confirm?token_hash={{ .TokenHash }}&type=email`, like `supabase/templates/` (backlog). Copy the wording over too.
- [ ] **Vercel environment variables for Production.** The new code reads three private variables `prod` doesn't use today, and `$env/static/private` fails the build if one is missing:
  - `SUPABASE_SERVICE_ROLE_KEY` (rig endpoints, `supabaseAdmin`)
  - `SESSION_TIMEOUT_MINS` (e.g. `120`; the one setting for session expiry)
  - `GET_TEST_RECORDS` (`false` in Production)

## 3. Migrations (in the window)

Follow [`database-workflow.md`](database-workflow.md). Pick a time when nobody is driving: between the push and the new deploy, connects and laps on the old `prod` fail.

- [ ] Have the `preview` → `prod` PR open, reviewed and green, so merging is one click.
- [ ] Drift check: `pnpm exec supabase db diff --linked` shows nothing beyond the 13 pending migrations.
- [ ] `pnpm exec supabase db push --dry-run`: exactly the 13 migrations in the table above, in that order.
- [ ] `pnpm exec supabase db push`.
- [ ] `pnpm exec supabase migration list --linked`: local and remote match.

No type regeneration needed: `src/lib/types/supabase.types.ts` comes from the local database, which has the same migrations. If `db diff --linked` was clean, they match hosted too.

## 4. Deploy (right after the push)

- [ ] Merge the `preview` → `prod` PR. Wait for the Vercel Production deployment to finish and check its build log.
- [ ] Smoke test on the production URL: log in, homepage (rig card in its empty state for a new user), a connect page, a lounge.

**Rollback:** fix forward. Vercel's instant rollback would put the old code back on a database it no longer matches (the two breaking migrations above), and migrations aren't reversible by push.

## 5. Rigs and the SimHub overlay (same window)

The rig endpoints now require the rig's key, and the old `rainIntesity` field is rejected. Per rig (the checklist in [`sprints/rig-endpoints.md`](sprints/rig-endpoints.md), Part 1, has the details):

- [ ] **Key.** The `rig_key` migration gave every existing rig a random key. Read it: `select r.name, k.api_key from public.rig r join public.rig_key k on k.rig_id = r.id;` (SQL editor; never paste it anywhere else).
- [ ] **QR image.** Upload `<rig uuid>.png` (the connect URL, never the key) to the `rig-qr` bucket in Studio.
- [ ] **Overlay config** on the rig PC: `baseUrl` (production URL), `rigId`, `apiKey`.
- [ ] **Overlay dashboard update** with this release's changes: the `?k=` key on every request, `rainIntensity` (was `rainIntesity`), **NewValidLap** bound to the lap-send action, and the poll interval decided above.
- [ ] **Verify** with the rig checklist, Part 1 step 4: poll, wrong key, connect, lap, stats, disconnect.

## 6. After the release

- [ ] Run the Sprint 2 demo script on production with a real rig (homepage card, Watch, the tip, the red carpet).
- [ ] Watch the Vercel logs for "Lap rejected" with `sectors_mismatch` on the first real laps: if valid laps miss by 1–2 ms, add the tolerance (rig-endpoints Open issue 2).
- [ ] Check the "What's new" card shows to every user until dismissed, and stays dismissed on another device.
- [ ] Delete or archive this file; note the release in the sprint docs.
