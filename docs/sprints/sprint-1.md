# Dá-lhe! — Sprint 1

## Goal

> A family member can scan the QR code, connect to or spectate a rig, and watch it come alive in the lounge room, with laps and stats arriving from a simulated rig through the real endpoints. Then they can disconnect.

Two fronts progress in parallel and meet in the lounge room:

- **Front A: Rig to App** — the endpoints the SimHub overlay will call (poll, lap, stats).
- **Front B: User to App** — connect, spectate, disconnect, and the lounge room (load + UI).

The fake-rig script (A5) is where the fronts join. Running it and watching the lounge room update is the sprint demo.

Out of scope: realtime (separate waterfall), SimHub overlay work, homepage, claiming flow, daily challenges.

---

## Principles for this sprint

- **Routes are thin.** `+server.ts` / `+page.server.ts` parse the request, call a service function, return a response. No business rules in routes.
- **Postgres rpc is the source of truth** for anything atomic or multi-row.
- **`$lib/server/rigs/`** holds the glue: rig lookup, validation, rpc calls, error mapping.
- **Session activity is lazy.** A session is active when it is not closed and `last_activity_at` is within the expiry window. No cron. Write rpcs close expired sessions as their first step.
- **Rig endpoints always send `Cache-Control: no-store`.** GETs with side effects must never be cached.
- **Stats never refresh `last_activity_at`.** Only connects and laps do.

---

## Database review

Existing rpcs: `connect_to_rig`, `disconnect_from_rig`, `get_or_create_active_session`, `insert_lap`.

### Missing for this sprint

| Item                                                                                                        | Purpose                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rig_status(rig)` (function or view)                                                                        | Returns `sessionActive` and the driver, with lazy expiry. Used by the poll endpoint and the lounge load. Reused later by `get_my_rigs`.             |
| `upsert_session_stats` / `upsert_live_lap_stats` (one or two functions, depending on the stats table shape) | Checks for a non-stale active session and writes in one round trip. No session: write nothing, return `ignored`. Must not touch `last_activity_at`. |

### To verify in existing rpcs

- **`insert_lap` on duplicate:** must return a "duplicate, nothing inserted" result instead of raising a unique violation.
- **`disconnect_from_rig` caller check:** if the caller is not the session's driver (stale tab), do nothing. If there is no active session, quiet no-op.
- **`connect_to_rig` takeover:** it closes an open session even if someone else is driving. Confirm this is an intended rule.

---

## Decisions to settle before starting

1. **Rig identity.** The rig UUID is exposed in the QR code and URLs. A separate per-rig `api_key` used only by the overlay would stop anyone who sees the QR from submitting laps. Concern: the rig can only send GET, so the key adds to the URL length (keep it short). Decide before A1.
2. **Takeover rule.** Connecting while another user is driving: silent takeover, or warn first? Affects B1 acceptance criteria.

---

## Front A: Rig to App

### A1. Endpoint plumbing

_As the system, I need every rig endpoint to share identification, validation and response conventions, so new endpoints are small._

- Unknown rig key returns 404, without leaking whether the rig exists.
- Invalid payload returns 400 with a readable message; schemas derive from the existing TS types.
- Every rig response carries `Cache-Control: no-store`.
- Routes contain no business rules; they call `$lib/server/rigs/*`.

### A2. Poll endpoint + `rig_status`

_As the overlay, I want to ask the app whether my rig has an active session, so I know whether to send stats._

- Returns rig name, `sessionActive`, and driver (or null).
- Expired sessions (by `last_activity_at`) report as inactive without any write.
- Polling does not refresh the session.

### A3. Lap endpoint

_As the overlay, I want to submit a valid lap, so it is recorded for the right session and driver._

- A valid lap is inserted via `insert_lap`; the response includes the lap id.
- Resending the same lap returns 200 with `duplicate: true` and creates no second row.
- No session: an anonymous one is created and the lap attached to it.
- The session's `last_activity_at` is updated.

### A4. Stats endpoints (session stats + live lap stats)

_As the overlay, I want to send session and live lap stats, so the lounge can show them._

- With an active session: stats are stored (latest values only); response is 200.
- With no active or a stale session: nothing is written; the response is still 200 with `ignored: true`.
- Stats never change `last_activity_at`.
- If time slips, defer this story. The lounge is demoable with laps alone.

### A5. Fake-rig script

_As the developer, I want to simulate a rig from the terminal, so I can test without SimHub._

- Scenarios: poll, valid lap, duplicate lap, stats with a session, stats without a session, unknown rig, stale session.
- Output shows status code and body per call.
- The script grows with each A-story; a story is done only when it has a scenario.

---

## Front B: User to App

### B1. Connect action

_As a family member, I want to connect to a rig after scanning its QR, so my laps are mine._

- Calls `connect_to_rig`, then redirects to the lounge room.
- The rig association is created, or `last_connected_at` is updated.
- Connecting while another user drives follows the takeover rule decided above.
- Unauthenticated or unknown-rig requests fail cleanly.

### B2. Spectate action

_As a family member, I want to watch a rig without driving it, so I can follow along._

- The secondary button on the connect page redirects to the lounge room.
- No association, no session change, no database write.

### B3. Disconnect action

_As the driver, I want to leave the rig, so the next person's laps aren't mine._

- Calls `disconnect_from_rig` and shows the rig as free.
- A non-driver (or stale tab) pressing it changes nothing.
- No active session is a quiet no-op, not an error.

### B4. Lounge room load

_As a viewer, I want the lounge to deliver everything it needs in one typed load._

- Returns: rig, status (`rig_status`), **session stats, live lap stats**, recent laps (limited), and the rig's unclaimed laps (no driver, not dismissed).
- Works for a connected user, a spectator, and a rig with no session (empty states, not errors).
- Session stats and live lap stats are empty or null when there is no active session.
- No data fetching happens in components.

### B5. Lounge room UI

_As a viewer, I want to see who's driving and how they're doing._

- Renders B4's data, mobile first: header, session card, live lap card, recent laps, unclaimed laps (read-only).
- Shows "Disconnect" only to the current driver.
- Empty states for no session, no laps, no driver and no live lap stats.
- Built with the Copilot brief; the first step is evaluating the existing draft (keep / replace).
- Nice-to-have, not in scope: when a lap completes, keep the finished lap's info (including sector 3) on the live lap card for 2–3 seconds before showing the new live lap.

---

## Suggested order

A1 → A2 → A5 (scaffold) → A3 → B4 → B1 → B5 → B2 → B3 → A4

The sprint is demoable after B5. B2, B3 and A4 are the cut line if time slips.

## Demo script

1. Run the fake-rig script: poll shows an inactive rig.
2. Scan the QR (or open the connect page), press Connect, land in the lounge room.
3. Run the script: send stats, then a lap, then the same lap again (duplicate ignored).
4. Refresh the lounge: stats, live lap stats and the new lap are visible.
5. Press Disconnect: the rig shows as free; stats sent now are ignored.

## Next sprints (outline)

- **Sprint 2, homepage:** `get_my_rigs` with lazy expiry, adaptive rig card, live feed, homepage load.
- **Sprint 3, claiming:** claim-laps card with count, unclaimed laps page and actions, multi-rig dropdown (low priority).
- **Waterfall 2:** realtime on the stats table, then the live feed.
- **Backlog:** daily challenge, unfinished business to-dos.
