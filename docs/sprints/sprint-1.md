# Dá-lhe! — Sprint 1

## Goal

> A family member can scan the QR code, connect to or spectate a rig, and watch it come alive in the lounge room, with laps and stats arriving from a simulated rig through the real endpoints. Then they can disconnect.

Two fronts progress in parallel and meet in the lounge room:

- **Front A: Rig to App** — lock down writes, then the endpoints the SimHub overlay calls (poll, lap, stats).
- **Front B: User to App** — connect (with deliberate takeover), spectate, disconnect, and the lounge room (load + UI).

The fake-rig tool (A5) is where the fronts join. Running it and watching the lounge room update is the sprint demo.

Out of scope: realtime (separate waterfall), SimHub overlay work, homepage and the "my rigs" list, claiming flow, daily challenges, a short public rig code, changes to manual lap entry (`/new`).

---

## Current state (observed 2026-10-28, `preview` branch)

Front A is further along than the first draft of this doc assumed, and several things are broken.

- **Built:** `$lib/server/rigs/` with `rigJson` (always `no-store`), `rigNotFound` (fixed body), `resolveRig` (UUID validation + `rig_status` rpc), zod schemas in `$lib/types/rig.ts`.
- **`rig_status` rpc exists** with lazy expiry and no writes. The poll endpoint returns its full row, including `driver_id` and `session_id`, to unauthenticated callers.
- **`/send/new` works for new laps.** On a duplicate, `insert_lap` hits `on conflict do nothing`, returns null, and the endpoint answers **400**. The duplicate still bumps `last_activity_at` and can create an empty anonymous session.
- **`/send/live` and `/send/session` are stubs** (copies of the poll).
- **`rig_stats` table exists:** one row per rig (`id` = rig id), `session_stats` and `lap_stats` json, each with an `_updated_at`. Already in the realtime publication, as is `rig`.
- **`connect_to_rig` cannot succeed.** It inserts `rig_drivers.user_id` (the column is `driver_id`) and deletes `rig_stats where rig_id` (the column is `id`). plpgsql only fails at run time. The connect action has the call commented out and just redirects.
- **`disconnect_from_rig`** has the same `rig_stats.rig_id` bug and no caller check.
- **Security, rig tables:** the rig rpcs are granted to `anon`. `connect_to_rig` takes the driver as a parameter instead of `auth.uid()`. `rig_session` allows insert and update to anyone; `rig_stats` allows update to anyone and delete to any logged-in user; `rig_drivers` lets a logged-in user rewrite any row to themselves. Anyone with the public anon key can reassign a session's driver.
- **Security, laps:** the policy "user can update other laps (pole_rating)" lets any logged-in user update **any column of any lap** (time, driver). It exists because the `update_pole_rating` trigger runs as the inserting user.
- **Default grants:** Supabase grants `EXECUTE` on every new function in `public` to `anon` and `authenticated` (plus Postgres's default grant to `PUBLIC`). New rpcs are callable by anyone unless revoked.
- **Manual lap entry** (`/new`) inserts into `lap_time` directly with the user's client; RLS limits it to the user's own `driver_id`.
- **Dead code:** `sendRigStats_Session`, `sendRigStats_Lap` (client-side `rig_stats` updates) and `getRigStats` / `connectToRig` in `$lib/queries/` are unused.
- **Lounge load exists** but uses `getRigById`, which ignores expiry (expired sessions look active). Recent laps are not scoped to the session; unclaimed laps are missing.
- **Lounge UI draft exists** (`lounge/+page.svelte`, ~480 lines). `docs/sprints/sprint-1-lounge-brief.md` has a data contract that predates `rig_stats`.
- **`pnpm check`:** 8 of the 13 baseline errors are in the connect and lounge pages (they read `rig.profiles.*`, which doesn't exist).
- **Fake rig:** `http/requests.http` exists but is empty.

---

## Decisions (all settled)

1. **Rig identity.** Each rig has two values:
   - `id` (UUID): **public**. Used in the QR code, connect and lounge URLs, and everything users see.
   - `api_key`: **secret**. Lives only in the database and the overlay config. Every rig endpoint requires it as a query param.

   The QR image is static, stored in the Supabase bucket per rig, and encodes the connect URL with the UUID only. Changing a key is manual: update the key in the database, paste it into the overlay config. UUID, QR, URLs and lap history are untouched.
   *Why:* without a key, anyone who has ever seen the QR can inject laps remotely into whoever is driving that rig, or into its unclaimed list (the repo is public and documents the endpoints). With it, that needs access to the rig PC, the same level as the threat that always existed (sitting in the rig and driving). Manual entry still lets any user add laps under their own name; the key is about laps landing in *someone else's* name. Not strong security; the right size for a family app.
2. **Takeover.** Connecting while someone else drives is allowed, but deliberate: the connect page warns that the rig has a driver and asks for confirmation. Switching seats should be quick, never accidental.
3. **Poll response.** Rig name, `sessionActive` and driver name only. No ids. (The trimming happens in the endpoint; `rig_status` itself keeps the ids, because the connect and lounge pages need the driver id.)
4. **Session creation.** Lazy: an anonymous session is created by the first lap. The poll and the stats endpoints never create sessions. Connecting closes any active session, including an anonymous one; its laps stay unclaimed (claiming is Sprint 3).
5. **Rig response contract.** The overlay retries a lap until it is handled, so every handled outcome returns **200** with a status. Only "never got here" is non-200.
   - `404`: unknown rig, malformed UUID or wrong key (same body for all).
   - `200` + `status`:
     - laps: `created` (with the lap id), `duplicate`, `rejected` (with a reason: invalid params, sectors don't add up, unknown car or track);
     - stats: `ok`, `ignored` (no active session), `rejected` (invalid params).
   - `5xx`: server error; the overlay may retry.

   The overlay can use the status to show feedback ("Lap saved in Dá-lhe!"). Response bodies use camelCase.

No short public rig code. Easy access without scanning comes later through the "my rigs" list (`rig_drivers`, Sprint 2).

---

## Principles for this sprint

- **Routes are thin.** `+server.ts` / `+page.server.ts` parse the request, call a service function, return a response. No business rules in routes.
- **Postgres rpc is the source of truth** for anything atomic or multi-row.
- **`$lib/server/rigs/`** holds the glue: rig lookup and key check, validation, rpc calls, error mapping. **Every rig endpoint goes through `resolveRig`.**
- **Rig tables have two write paths, no others.** `rig_session`, `rig_stats` and `rig_drivers` are written only by the rig endpoints (service role) or by user rpcs that take the user from `auth.uid()`. No client-side writes. (Laps keep a third path: manual entry, own laps only.)
- **Every new or changed rpc states who may call it.** Revoke `EXECUTE` from `public, anon, authenticated`, then grant back only what's needed. `security definer` functions always `set search_path = ''` and use schema-qualified names.
- **Changing an rpc's arguments or return type means dropping the old one.** `create or replace` with new arguments creates an overload and leaves the old version callable; a new return type fails outright.
- **Session activity is lazy.** A session is active when it is not closed and `last_activity_at` is within the expiry window. No cron. Write rpcs close expired sessions as their first step, with `ended_at = last_activity_at`. Every rpc uses the same timeout (`SESSION_TIMEOUT_MINS`).
- **Rig endpoints always send `Cache-Control: no-store`.**
- **Only connects and created laps refresh `last_activity_at`.** Not stats, not duplicates, not polls.
- **Naming:** SimHub's practice or race session is the **sim session** (`simSession` in types). "Session" alone means `rig_session`.

---

## Front A: Rig to App

### A0. Lock down writes *(new)*
*As the system, I want rig data and laps writable only through the paths meant for them, so nobody can drive someone else's session or edit someone else's lap with the public anon key.*

One migration:

- **`connect_to_rig`**
  - Takes the driver from `auth.uid()`; `security definer`; executable by `authenticated` only. The old two-argument version is dropped.
  - Closes expired sessions first (same rule as `rig_status`), so the page and the rpc agree on who is driving.
  - Takes the driver the user was shown (or null). If the current driver differs, it changes nothing and returns `driver_changed`. Otherwise it closes the active session (driver or anonymous), opens a new one and returns `connected`. Runs under the existing rig row lock.
  - Bugs fixed (`rig_drivers.driver_id`, `rig_stats.id`). Still clears `rig_stats` for the rig.
- **`disconnect_from_rig`**
  - `auth.uid()`, `security definer`, `authenticated` only.
  - Bug fixed. Only the session's driver can close it. Not the driver, or no active session: quiet no-op.
- **Rig-only rpcs** (`insert_lap`, `get_or_create_active_session`, the stats rpc from A4): service role only.
- **`rig_status`** stays read-only and executable by `authenticated` (connect and lounge pages).
- **Policies**
  - `rig_session`, `rig_stats`, `rig_drivers`: client insert, update and delete policies removed. Select stays as it is.
  - `lap_time`: the "update other laps" policy removed. `update_pole_rating` becomes `security definer` so manual entry still updates pole ratings.
- **Dead code** removed: the unused client-side stats and connect helpers in `$lib/queries/`.
- **Done when:** with the anon key, and with a logged-in user's token, direct writes to `rig_session` / `rig_stats` / `rig_drivers`, updates to `lap_time`, and calls to `insert_lap` all fail; `connect_to_rig` only ever connects the caller; manual entry still works and still updates pole ratings.

### A1. Rig api key
*As the system, I want rig endpoints to require the rig's secret key, so seeing the QR is not enough to submit laps.*

- Key stored in its own table (`rig_key`: `rig_id` primary key → `rig`, `api_key`), RLS on with no policies, no client grants, not in the realtime publication. Not a column on `rig`, which is publicly readable and broadcast by realtime.
- The migration generates a random key for every existing rig; seed rigs get known values.
- `resolveRig` takes the UUID and the key `k`. Missing or wrong key returns the same 404 as an unknown rig.
- The key is never returned by any endpoint or load, and the app never logs request URLs or the key.
- `docs/rig-endpoints.md` updated: the key, the response contract, and how to change a key.

### A2. Poll response
*As the overlay, I want to know whether my rig has an active session and who's driving.*

- Returns rig name, `sessionActive`, driver name (or null). No ids.
- Expired sessions report as inactive without any write.

### A3. Lap endpoint: handled outcomes
*As the overlay, I want every lap I send to get a definite answer, so I can stop retrying and show feedback.*

- New lap: inserted via `insert_lap`; `200 {status: "created", lapId}`. The session's `last_activity_at` is updated. No session: an anonymous one is created.
- Same lap again: `200 {status: "duplicate"}`. No second row, no session created, `last_activity_at` untouched.
- Invalid params, sectors not adding up, unknown car or track: `200 {status: "rejected", reason}`. Rejected laps are logged server-side with their params (never the key), so a lap on a car or track missing from the catalog can be recovered by hand.
- `insert_lap` returns the outcome (lap id plus status) instead of a bare null; the old signature is dropped.

### A4. Stats endpoints (live lap stats + sim session stats)
*As the overlay, I want to send live lap and sim session stats, so the lounge can show them.*

- Upserts the rig's `rig_stats` row (latest values only): `/send/live` → `lap_stats`, `/send/session` → `session_stats`, each with its timestamp. One rpc, service role only.
- Active session: stored, `200 {status: "ok"}`. No active or a stale session: nothing written, `200 {status: "ignored"}`. Invalid params: `200 {status: "rejected", reason}`.
- Never changes `last_activity_at`; never creates a session.
- If time slips, defer this story. The lounge is demoable with laps alone.

### A5. Fake rig
*As the developer, I want to simulate a rig from the terminal, so I can test without SimHub.*

- Targets the local stack by default, using a seed rig and its known key.
- Scenarios: poll, created lap, duplicate lap, rejected lap, wrong key, unknown rig, stats with a session, stats without a session, stale session.
- Output shows status code and body per call.
- Pick one format (script or `.http` file) and delete the other.
- Grows with each A-story; a story is done only when it has a scenario.

---

## Front B: User to App

### B1. Connect action, with deliberate takeover
*As a family member, I want to connect to a rig after scanning its QR, so my laps are mine.*

- Rig free (no session, or an anonymous one): Connect calls `connect_to_rig` and redirects to the lounge room.
- Rig has a driver: the page warns ("Alex is driving") and Connect asks "Are you sure?" before taking over. The confirmation re-renders the same form with a confirm field; no client JS needed.
- The form posts the driver it showed. If `connect_to_rig` returns `driver_changed` (someone connected after the page loaded), the page re-renders with the current driver and the warning, instead of connecting.
- Already the driver: the connect page redirects to the lounge.
- The rig association is created, or `last_connected_at` is updated.
- Unauthenticated requests go to login and back; unknown rig is a 404.
- Connect page reads `rig_status` and is clean in `pnpm check`.

### B2. Spectate action
*As a family member, I want to watch a rig without driving it.*

- The secondary button on the connect page redirects to the lounge room.
- No association, no session change, no database write.

### B3. Disconnect action
*As the driver, I want to leave the rig, so the next person's laps aren't mine.*

- Calls `disconnect_from_rig` and shows the rig as free.
- A non-driver (or stale tab) pressing it changes nothing.
- No active session is a quiet no-op, not an error.

### B4. Lounge room load
*As a viewer, I want the lounge to deliver everything it needs in one typed load.*

- Returns: rig, status (`rig_status`), sim session stats, live lap stats, the latest lap (for the new-lap banner), the session's laps, and the rig's unclaimed laps (no driver, not dismissed).
- Uses `rig_status` instead of `getRigById`, so expired sessions show as inactive.
- Lap lists respect the test flag, like the other listings.
- Works for a connected user, a spectator, and a rig with no session (empty states, not errors).
- Stats are null when there is no active session.
- No data fetching in components. Lounge page is clean in `pnpm check`.

### B5. Lounge room UI
*As a viewer, I want to see who's driving and how they're doing.*

- Renders B4's data, mobile first: header, sim session card, live lap card, new-lap banner, session laps, unclaimed laps (read-only).
- A refresh button reloads the data (realtime comes in Waterfall 2).
- Shows "Disconnect" only to the current driver.
- Empty states for no session, no laps, no driver and no live lap stats.
- First step: update the data contract in `sprint-1-lounge-brief.md` to match B4, then evaluate the existing draft (keep / replace).
- Nice-to-have, not in scope: when a lap completes, keep the finished lap's info (including sector 3) on the live lap card for 2–3 seconds before showing the new live lap.

---

## Suggested order

A0 → A1 → A2 → A5 (scaffold) → A3 → B4 → B1 → B5 → B2 → B3 → A4

A0 first: every other story depends on the rpcs it fixes, and B1 can't work without it.

The sprint is demoable after B5. **Cut line:** B2, B3 and A4 can slip. A0, A1 and A3 cannot.

## Demo script

1. Run the fake rig: poll shows an inactive rig. Same call with a wrong key: 404.
2. Scan the QR (or open the connect page), press Connect, land in the lounge room.
3. Run the fake rig: send stats, then a lap (`created`), then the same lap again (`duplicate`), then a lap whose sectors don't add up (`rejected`).
4. Refresh the lounge: stats, live lap stats, the new-lap banner and the session laps are visible.
5. Log in as a second user, open the connect page: warning and confirmation, then takeover.
6. Press Disconnect: the rig shows as free; stats sent now are `ignored`.
7. With the anon key, try to update `rig_session` directly; logged in, try to change someone else's lap time: both refused.

## Next sprints (outline)

- **Sprint 2, homepage:** `get_my_rigs` with lazy expiry (the "my rigs" list, connect without scanning), adaptive rig card, live feed, homepage load.
- **Sprint 3, claiming:** claim-laps card with count, unclaimed laps page and actions (through rpcs, now that client updates to `lap_time` are gone), multi-rig dropdown (low priority).
- **Waterfall 2:** realtime on `rig_stats` (already in the publication), then the live feed.
- **Backlog:** daily challenge, unfinished business to-dos, overlay feedback on lap status ("Lap saved in Dá-lhe!").
