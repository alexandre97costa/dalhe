# Dá-lhe! — Sprint 2: Rig access

## Goal

> A family member who has connected to or spectated a rig once finds it on the homepage, sees at a glance whether someone is driving, and can watch or connect without scanning the QR. Away from home included.

One front, three layers:

- **Database (D):** spectating associates the user with the rig; one read rpc lists a user's rigs with their status; a small table remembers dismissed tips.
- **Server (S):** the Spectate action writes the association; the homepage load returns the rigs; the lounge load returns the tip.
- **UI (U):** the adaptive rig card on the homepage, its actions, and the one-time tip.

Out of scope: realtime (postponed, see Backlog), the live feed and the rest of the homepage rework, a "My rigs" header dropdown, a rigs list page, share links, screen wake lock, PWA install, push notifications, session history, the "What's new" card (added as the last step before this batch ships, see Release), the lounge rig switcher.

---

## Current state (verified 2026-11-06 against `origin/preview` @ 41ae6b0 and the local database)

The local database has all ten migrations up to `20261105171322_lounge_driver_avatar`; it matches the repo.

- **`rig_drivers`:** columns `id bigint` (identity), `created_at timestamptz not null default now()`, `rig_id uuid not null` → `rig`, `driver_id uuid not null` → **`profiles`** (not `auth.users`), `last_connected_at timestamptz` **`not null default now()`**.
  - Primary key is the surrogate `id`. `(rig_id, driver_id)` is a unique constraint (`rigs_drivers_rig_id_driver_id_key`), which `connect_to_rig`'s `on conflict` uses. No index leads with `driver_id`, so D2 needs one.
  - Select policy: `authenticated`, `using (true)`: every logged-in user can read every association. No insert/update/delete policies (A0 dropped them); table grants are still `ALL` to `anon` and `authenticated`, harmless under RLS.
  - Written only by `connect_to_rig` (security definer, `search_path = ''`, `authenticated` + `service_role`). Seed: 5 rows, all with `last_connected_at` defaulted to the reset time.
  - Because `last_connected_at` is `not null default now()`, a spectate-only row would get a connect time it never had. D1 needs `last_connected_at` nullable (and its default dropped) for "spectate-only" to exist.
- **Spectate:** not an action. It's a plain link to `/connect/[slug]/lounge` inside the connect form; it writes nothing. The connect page has one `default` action (Connect); there's no `?/spectate`. The route param is `[slug]` (the rig UUID), not `[rigId]`.
  - **Login:** `/connect/*` is not in `hooks.server.ts`'s free-access list (`'/connect/'` is commented out), so the hook redirects anonymous users to `/login?redirectTo=…` before any load or action runs. Spectate, the lounge and the connect page all require login already. The Connect action also has its own `if (!user)` redirect.
- **`rig_status(p_rig_id, p_expiry_minutes)`:** `language sql stable`, **not** security definer, no `search_path` set, unqualified table names; executable by `authenticated` and `service_role`. The expiry rule is **inline**: `ended_at is null and last_activity_at > now() - make_interval(mins => p_expiry_minutes)`. No shared helper exists.
  - The same rule is also written out in `upsert_rig_stats` (same `>`), and its closing counterpart (`<=`) in `connect_to_rig` and `disconnect_from_rig`; `get_or_create_active_session` uses `<` (a one-instant edge where it disagrees).
  - The minutes come from the app: `SESSION_TIMEOUT_MINS` (private env), passed by `$lib/queries/rig.ts` and `$lib/server/rigs`. The database has no value of its own.
- **Homepage** (`(authorized)/home`): the load awaits `getRecentLaptimes` and returns `{ laptimes }`; the page is the recent-laps accordion with an empty state. No rig card or placeholder, **no skeletons and no streaming** on the homepage. (`home/plan.ts` is an unused type sketch for recent laps.) The only skeleton in the app is the lounge's (`LoungeSkeleton.svelte` + `lastResolved.svelte.ts`, streamed promises), which the card can copy.
- **Lounge load contract** (`docs/sprints/lounge-brief.md` on `preview`, with the Streaming section): awaits `getRigStatus`, returns `rig`, `status`, `isDriver` plus streamed `session` and `unclaimedLaps` promises; the page has no form actions besides Disconnect. The tip adds one awaited field (`tips`) and a `dismissTip` action. No `user_tip` table and no `$lib/config/tips.ts` yet.
- **This doc** is only on `chore/fix-type-errors` (commit 960da54), not on `preview`; that branch's `lounge-brief.md` is the pre-streaming version.

---

## Decisions (all settled)

1. **What creates an association.** Connect (as today) and the **Spectate button**. Nothing else: opening the connect page, visiting the lounge by URL, or a page load never writes. There are no share links.
2. **Spectating touches only `rig_drivers`.** It upserts the user's row and sets `last_viewed_at`. It never touches `rig_session`, `last_activity_at`, `rig_stats` or `last_connected_at`. Connect keeps its current behaviour (`last_connected_at`).
3. **Recency.** A rig's "last used" for this user is the later of `last_connected_at` and `last_viewed_at`.
4. **Remote connect stays allowed.** The card's **Watch** is the primary action; **Connect** is secondary and always goes through the connect page, so the existing takeover warning and confirmation apply. No one-tap connect from the homepage, even when the rig is free: the connect page is the guard for connecting from the office.
5. **Watch goes through the Spectate action** (a form posting to `/connect/[rigId]?/spectate`), so watching from the card also refreshes `last_viewed_at` and there is one write path for spectating.
6. **Card states, by number of rigs:**
   - **0:** empty state. "Scan the QR code on a rig to get started."
   - **1** (the common case): full card with name, status, Watch and Connect.
   - **2+** (realistically Alex): compact list, one row per rig with name, status and Watch; Connect inside each row's secondary action.
   - **You're driving** (any count): that rig is shown first as the red carpet ("You're driving at Sala"), with one action: Lounge (a plain link; you're already associated). No Connect.
7. **Status per rig** (same rule as `rig_status`, lazy expiry, no writes):

   | Session           | Shown as                    |
   | ----------------- | --------------------------- |
   | None, or expired  | Free                        |
   | Active, a driver  | Driving: {name}             |
   | Active, the user  | You're driving (red carpet) |
   | Active, anonymous | In use, no driver connected |

   The anonymous wording tells the family that laps are landing unclaimed. Copy is Alex's call (see Manual decisions).

8. **Ordering.** Live rigs first (active session), then by recency (Decision 3), newest first. No cap.
9. **No realtime.** Status is as of the homepage load. Nice-to-have: re-run the load when the tab becomes visible again (`visibilitychange` → `invalidate`), so returning to the app shows fresh status.
10. **The "saved" tip.** Copy: "Saved to your homepage. Next time, no QR needed." Shown in the lounge room (where Connect and Spectate land) to a user who has at least one rig association and hasn't dismissed it. Shown until dismissed (an ×), not "once on view": that would be a write inside a GET. Existing users with associations from before this sprint will see it on their next lounge visit, which is fine, because it's true for them too.
11. **Tip dismissals live in the database**, per user, not in `localStorage`, so a dismissal follows the user across devices and browsers. The table is generic (`tip_key`) so the "What's new" card can reuse it.

---

## Principles for this sprint

Sprint 1's principles still apply: thin routes, rpc as source of truth, revoke-then-grant on every rpc, `security definer` with `set search_path = ''`, drop on signature change, no data fetching in components. Added:

- **Spectating is not a session event.** Any change that makes spectating touch session data is a bug.
- **One expiry rule.** `get_my_rigs` and `rig_status` must agree on whether a session is active. If the rule is inline in `rig_status`, extract it into one helper both use, rather than copying it.

---

## Database (D)

### D1. Spectate association

_As a spectator, I want the rig remembered when I watch it, so it's on my homepage next time._

- Migration: `rig_drivers.last_viewed_at timestamptz null`. Existing rows keep it null (recency falls back to `last_connected_at`). `last_connected_at` becomes nullable (Alex, at sprint start), so a spectate-only row has no connect time.
- New rpc `spectate_rig(p_rig_id uuid)`: `security definer`, takes the user from `auth.uid()`, executable by `authenticated` only. Upserts the row and sets `last_viewed_at = now()`. Returns a typed outcome: `ok` or `not_found`.
- **Done when:** calling it creates or updates exactly one `rig_drivers` row, and `rig_session`, `rig_stats`, `last_activity_at` and `last_connected_at` are unchanged (checked in the scenario, not assumed). With the anon key it fails. Called for another user it can't be: there is no user argument.

### D2. `get_my_rigs`

_As the homepage, I want the user's rigs with their status in one call._

- Read-only rpc, `authenticated` only, user from `auth.uid()`. Takes `p_expiry_minutes`, like `rig_status` (Alex, at sprint start): the app's `SESSION_TIMEOUT_MINS` stays the one place the timeout is set.
- One row per associated rig: rig id, rig name, `sessionActive`, driver name (null for none or anonymous), `driverIsMe`, `isAnonymous`, last used (Decision 3).
- Ordered per Decision 8, so the UI doesn't sort.
- Lazy expiry with no writes, via the shared rule (Principles).
- Index on `rig_drivers (driver_id)` if the primary key doesn't already lead with it.

### D3. Tip dismissals

- Table `user_tip` (`user_id` → `auth.users`, `tip_key text`, `dismissed_at`; primary key `user_id, tip_key`). RLS: select and insert own rows only. A dismissal is the user's own data, so a client-side write through RLS is acceptable here; if Claude Code prefers an rpc for consistency with the rig tables, that's fine too.
- Tip keys as a TS union in one place (`$lib/config/tips.ts`), starting with `rig_saved`.

---

## Server (S)

### S1. Spectate action writes the association

- The connect page's Spectate action calls `spectate_rig`, then redirects to the lounge. `not_found` → 404.
- Unauthenticated → login and back (same as Connect).
- Connect action unchanged.

### S2. Homepage load: rigs

- Calls `get_my_rigs`, returns the list typed, plus the red-carpet rig (if any) split out so the UI doesn't search for it.
- Empty list is a state, not an error.

### S3. Lounge load: tip

- Adds `tips: { rigSaved: boolean }`: true when the user has at least one association and no `rig_saved` dismissal.
- Dismiss action (`?/dismissTip`, posts the key) on the lounge; validated against the tip key union.
- `lounge-brief.md` contract updated.

---

## UI (U)

### U1. Rig card

_As a family member, I want my rig on the homepage, so I can check on it from anywhere._

- Renders Decision 6 and 7: empty, single, list, red carpet.
- No skeleton (Alex, at sprint start): the homepage has none and will be reworked, so the load awaits `get_my_rigs`.
- Mobile first; the single-rig card is the design that matters, the list is its compact sibling.
- Status visible without reading the copy: a status dot or chip (free / driving / in use), with the text beside it for accessibility.

### U2. Card actions

- **Watch:** form posting to the Spectate action of that rig (Decision 5). Works without client JS.
- **Connect:** link to `/connect/[rigId]` (Decision 4).
- **Lounge** (red carpet): plain link.
- Nice-to-have: refresh on `visibilitychange` (Decision 9).

### U3. "Saved" tip

- One small dismissible component (reusable for future tips), rendered in the lounge when `tips.rigSaved` is true. One line plus ×. Not a modal, not a toast that vanishes on its own.
- Dismissing posts `?/dismissTip` and hides the tip without a full reload.

---

## Seed and scenarios

- **Seed users:**
  - one with no rigs (empty state);
  - one with one rig, spectate-only (`last_viewed_at` set, no `last_connected_at`);
  - one connected and driving (red carpet);
  - Alex-like user with three rigs: one free, one driven by someone else, one with an anonymous session.
  - One association whose session expired (shows Free).
- **Scenarios** (script or test, Claude Code's choice):
  - spectate creates the row and leaves every session field untouched;
  - spectate twice updates `last_viewed_at` only;
  - `get_my_rigs` ordering and statuses for the three-rig user;
  - an expired session reports Free from both `get_my_rigs` and `rig_status`;
  - `spectate_rig` and `get_my_rigs` refused with the anon key;
  - the tip shows, is dismissed, and stays dismissed on another browser.
- **Done for every story:** `pnpm check` and `pnpm lint` clean, the relevant scenario passes, a mobile-width screenshot for UI stories.

---

## Suggested order

D1 → D2 → D3 → seed → S1 → S2 → S3 → U1 → U2 → U3

Small enough for one Claude Code session per layer, in sequence. No parallel streams needed.

**Cut line:**

- Cannot slip: D1, D2, S1, S2, U1, U2.
- Can slip: the `visibilitychange` refresh, the list (2+) polish beyond "it works", U3 with D3 and S3 (ship them together or not at all).

## Demo script

1. Log in as the no-rigs user: the homepage shows the empty state.
2. Open a rig's connect page, press Spectate: land in the lounge with the "Saved to your homepage" tip. Check in Studio that the rig's session row and `last_activity_at` didn't change.
3. Dismiss the tip. Log in on another browser: the tip stays dismissed.
4. Back on the homepage: the rig card shows the rig and its status. Press Watch: the lounge opens.
5. Press Connect on the card while someone else drives: the connect page warns and asks for confirmation.
6. Connect: the homepage now shows the red carpet. Press Lounge.
7. Log in as the three-rig user: the list shows live rigs first, the anonymous one as "In use, no driver connected", the expired one as Free.

## Release

Before this batch goes live (with the Sprint 1.5 lounge changes):

- **"What's new" card:** one dismissible card listing the two or three changes, reusing `user_tip` (key e.g. `whats_new_2026_11`). A small story of its own, written when the release contents are final.
- Run the Sprint 1.5 X4 SimHub id check against hosted, if it hasn't run yet.
- `db push` the migrations; regenerate types.

## Manual decisions (for Alex)

- **Anonymous session copy:** "In use, no driver connected" is a placeholder. Something warmer may fit ("Someone's driving, not connected").
- **Card visual:** status dot vs chip; whether the single-rig card shows anything else (rig name only for now).
- **Tip copy:** "Saved to your homepage. Next time, no QR needed."

## Backlog (from this sprint's discussion)

- **Screen wake lock** in the lounge (`navigator.wakeLock.request("screen")`), held only while a session is active, re-requested on `visibilitychange`.
- **PWA:** manifest (name, icons, `display: standalone`, `start_url`, shortcuts) and a service worker. Before promoting installs, test login inside an installed iOS app: it doesn't share the browser's storage, and magic links open in Safari, not the app.
- **Push notifications** ("someone started driving"): needs the PWA on iOS, a `push_subscription` table, VAPID keys and the `web-push` package. Trigger from the connect action; anonymous sessions are harder.
- **Session history:** a past sessions list page and a session detail page.
- **Realtime:** postponed; ranked below the homepage rework and tournaments.

## Outcome (2026-11-06, branch `feat/rig-access`)

**Shipped: every story, nothing past the cut line.** D1, D2, D3, seed, S1, S2, S3, U1, U2, U3, plus the `visibilitychange` refresh.

- **Database:** three migrations (`20261106002555_rig_spectate`, `20261106002557_my_rigs`, `20261106002559_user_tip`), all additive, and `prod` keeps working with them. `rig_status` keeps its signature, result and grants. It's now `security definer` with `search_path = ''` and reads the shared rule from `rig_active_session`, which has no API grants. `get_my_rigs(p_expiry_minutes)` and `spectate_rig(p_rig_id)` follow revoke-then-grant, `authenticated` only.
- **Scenarios:** `supabase/tests/database/rig_access.test.sql` has 30 checks. Spectating leaves `rig_session` (including `last_activity_at`), `rig_stats` and `last_connected_at` untouched, by diffing before and after. Spectating twice moves only `last_viewed_at`. Alice's ordering and statuses are checked, and `get_my_rigs` and `rig_status` agree on the expired session at two timeouts. Anon is refused, and the tip RLS is covered. The full suite has 107 checks and passes after `pnpm db:reset`.
- **Browser checks at 375 px, local stack:** I checked the empty state (Diogo), the single card, Alice's four-rig list (Escritório anonymous, Garagem driven, Cave expired, Sala free), and the red carpet after a Connect. Watch from the card also works as a native form post with no JS. The tip shows, hides without a reload, also dismisses without JS, and stays dismissed after a fresh sign-in with storage cleared.
- **Seed:** two new rigs, Escritório (anonymous session) and Cave (session idle for 3 h, so expired). Personas: Diogo has no rigs, Bruno is spectate-only, Carla has the red carpet, Alice has four rigs.

**Small calls made during the build:**

- **`last_connected_at` keeps its `default now()`:** it's only nullable now. `spectate_rig` inserts an explicit null and `connect_to_rig` always sets it, so dropping the default would change nothing today and is one less change on `prod`.
- **The connect page's `default` action is now `?/connect`:** SvelteKit doesn't allow a default action next to a named one (`?/spectate`). Spectate is a `formaction` button in the same form.
- **Connect in the list:** in the 2+ list, a row's secondary action is a small "Connect" link, not a menu, so it works without JS.
- **The status label and red carpet wrap instead of truncating:** "In use, no driver connected" and "You're driving at Garagem" didn't fit at 375 px.
- **Tip dismissals:** written by the client through RLS on `user_tip`, with no rpc. The key shape is checked in the database (`^[a-z0-9_]{1,64}$`), and the key itself is checked in the action (`isTipKey`).
- **No parallel worktree agents for U1/U2 and U3:** each worktree needs its own install, `.env` and Paraglide build, which costs more than U3 did. An independent reviewer agent checked the branch against Decisions, Principles and the D1 "Done when". It found no blockers; its should-fixes are in.

**Left for Alex:**

- **Manual decisions:** the anonymous copy (still "In use, no driver connected"), the card visual (a status dot, free = green, driving = amber, anonymous = blue, red carpet in purple) and the tip copy. Portuguese strings are first drafts.
- **`pnpm lint` on `preview`:** it already fails in 44 files this branch doesn't touch (shadcn `ui/*`, older docs, a few components). Every file changed here passes Prettier. That needs a separate formatting PR.
- **Release:** the "What's new" card (Release section), `db push` of the three migrations after `--dry-run`, then regenerating types.
- **Remaining copies of the expiry rule:** `upsert_rig_stats`, `connect_to_rig`, `disconnect_from_rig` and `get_or_create_active_session` still have their own copies (the last one uses `<`). Moving them onto `rig_active_session` is a later cleanup.
