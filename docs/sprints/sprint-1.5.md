# Dá-lhe! — Sprint 1.5

## Goal

> The lounge room tells the story of a session at a glance: a live lap that pauses to show the lap just finished, pace colours on every sector and lap, a lap list that can be compact, and a session card that stays out of the way. Sprint 1's loose ends are closed before realtime.

A polish sprint between Sprint 1 and Sprint 2 (realtime). Three lounge components change, on top of a shared foundation, plus a group of leftovers:

- **Foundation (F)** — SimHub id mapping, bests, the full load contract, pace rules, shared pieces. Everything else builds on it.
- **Live lap (L)** — sector logic, pace colours, invalid laps, the freeze frame. Replaces the new-lap banner.
- **Session laps (S)** — compact and table views, sort, track/car separators, pace colours and badges.
- **Session card (C)** — collapsed by default, organised expanded view, stale stats.
- **Leftovers (X)** — Sprint 1 open issues and launch prerequisites.

Out of scope: realtime and auto-refresh (Sprint 2), the unclaimed laps page and claiming (Sprint 3), restyling the unclaimed list in the lounge, overlay changes (except the `rainIntensity` rename, coordinated with Alex), the homepage, the final colour pass.

---

## Current state (observed 2026-10-30, `preview` branch, after PR #24)

- **Lounge page** (`/connect/[rigId]/lounge`): one server load, no realtime, a Refresh button. Top to bottom: header, new-lap banner, session card, live lap card, session laps, Disconnect (driver only), unclaimed laps. Details in `docs/sprints/lounge-room-context.md`.
- **Session card** shows SimHub ids humanized ("Porsche 991ii Gt3 R"), while the lap lists show catalog names ("Porsche 911 II"). There is no mapping between the two in the load.
- **Live lap card** colours a sector purple when it is ≤ SimHub's best sector (`bestSx_ms` from the live stats). `currentSplit` is received but not shown. The S2 tile currently shows the time elapsed in the sector.
- **Session laps** show time, "Best" badge or +delta to the session best, S1 S2 S3, and "track · car" on every row. Capped at 100 per session.
- **Unused data:** `statsUpdatedAt.simSession`, `statsUpdatedAt.liveLap`, the rain forecasts, `currentSplit`.
- **`rainIntesity`** is our typo; SimHub spells it correctly. The schema, the endpoint and the overlay config all use the typo.
- **Open issues from `docs/rig-endpoints.md`:** sector conversion rounding, sector sum tolerance, missing `rig-qr` bucket, `zSessionStats` errors, poll interval. Verify which are still open; some may have been fixed in A3.

---

## Decisions (all settled)

1. **Pace colours.** Sectors and laps share one ladder. First match wins:

   | Colour (undertone) | Rule | Label (laps only) |
   |---|---|---|
   | Purple (violet) | ≤ app-wide best | "Track Record" |
   | Blue (violet) | ≤ session best | "Session best" |
   | Green (teal) | ≤ session best × (1 + `PACE_BAND`) | "On pace" |
   | Yellow (orange) | anything else | none |
   | Neutral (white / grey) | sector in progress, or no best to compare with | none |

   - Purple and blue share a violet undertone: both mean "best in something".
   - Sectors carry colour only (no text). Laps carry badges (or crowns in the compact view), never colour stripes.
   - The delta badge on the live lap uses its own colours: lime green when faster, pink-red when slower. An invalid lap uses a darker "normal" red. The final colour pass and colour-blind tests come later.

2. **Bests come from the database, never from SimHub.**
   - Scope: track + car category, like the leaderboards. Respects the test flag.
   - Best sector: the best ever set for that sector, regardless of the lap it was on.
   - Session best: the best within the current session, per track + car category.
   - Nulls are skipped: sector bests come from laps with sectors; lap bests count every lap, including legacy laps without sectors.
   - Only valid laps exist in the database, so bests are only from valid laps.
   - Ties: the ladder uses ≤, so two equal times both get the colour.
   - `bestS1_ms`, `bestS2_ms`, `bestS3_ms` in the live stats are no longer used by the lounge. The schema keeps them optional so the overlay doesn't need to change now.

3. **Colour now, not at the time.** Every lap is compared with today's bests. When a best is beaten, the old lap's colour drops (as in F1 qualifying timing). Expect mostly green and yellow in a session; purple and blue move.

4. **SimHub ids map to the catalog.**
   - The load translates the sim session's `TrackId` / `CarId` through `race_track.simhub_trackid` / `car.simhub_carid` to the catalog track, car, make and category.
   - The lounge shows catalog names. When an id is not mapped, the labels fall back to the humanized SimHub id and there are no bests (neutral colours). Not an error.
   - **Launch requirement:** every car and track in use has its SimHub id filled in. An unmapped car means a rejected lap, not just a UI glitch. Both columns are unique.

5. **Freeze frame.**
   - When the latest lap of the **current session** is ≤ `FREEZE_WINDOW_S` (20 s) old at load time, the live lap card shows that lap instead of the live lap, for `FREEZE_DURATION_S` (5 s).
   - The lap age is computed on the server. The client only counts down.
   - A "Show live lap" button at the bottom of the card dismisses it at once. Its background fills over the 5 seconds (like Netflix's "Next episode"). With `prefers-reduced-motion`, a countdown replaces the sweep.
   - A lap freezes at most once per page view: dismissed and expired laps are remembered in component state, so Refresh doesn't replay them.
   - Invalid laps never freeze (they never reach `/send/new`).
   - The new-lap banner is removed.

6. **Bests query.** One rpc, called by the load on every page load and Refresh. No caching: it is a few aggregates over one track's laps, and Refresh is a human pressing a button. In Sprint 2, realtime re-fetches the bests only on a new lap or a track/car change, so the rpc takes those as inputs.

7. **Tuning values are constants, not environment variables.** One file, `$lib/config/lounge.ts`: `FREEZE_WINDOW_S = 20`, `FREEZE_DURATION_S = 5`, `PACE_BAND = 0.01`, `STATS_STALE_AFTER_S`. They are UX tuning, the same in every deployment.

8. **Pace band: one universal value.** 1% for sectors and laps alike. It's proportional and coherent (three green sectors add up to a green lap). A per-track override (`race_track.pace_band`, nullable, falling back to the constant) can be added later if a track needs it.

9. **View choices persist per viewer**, the same on every rig: list view, sort, session card collapsed/expanded. Stored in `localStorage`, wrapped in try/catch, with the defaults when storage is unavailable.

---

## Principles for this sprint

Sprint 1's principles still apply (thin routes, rpc as source of truth, revoke-then-grant on every rpc, drop on signature change, `no-store` on rig endpoints). Added:

- **The foundation owns the server.** After F, the L, S and C streams are UI only: they read the load contract and don't change `+page.server.ts`, queries or migrations. If a stream needs more data, that goes back to F.
- **Pace logic lives in one pure function**, with unit tests. Components never compare times themselves.
- **No data fetching in components** (unchanged).
- **English UI copy:** tracks take "at" ("Practice at Monza").

---

## Foundation (F)

### F1. Split the lounge page and define the load contract
*As the developer, I want each lounge component in its own file with a fixed data contract, so the three UI streams can run in parallel without editing the same file.*

- `lounge/+page.svelte` becomes a thin shell composing `SessionCard`, `LiveLapCard`, `SessionLaps` (plus the existing header, Disconnect and unclaimed list).
- The load's return type is written down in `docs/sprints/lounge-brief.md` (replacing the Sprint 1 contract) and exported as a type. It includes everything F2–F4 add.
- The new-lap banner is removed here (no stream owns it).
- **Done when:** the page renders as before minus the banner; `pnpm check` is clean for the lounge.

### F2. SimHub id mapping
*As a viewer, I want the lounge to use the app's own names for cars and tracks, so the session card matches the lap list.*

- Unique constraints on `car.simhub_carid` and `race_track.simhub_trackid`. Check for duplicates in hosted and local first; the migration fails otherwise.
- The load maps the sim session's `TrackId` / `CarId` to: track (id, name), car (id, make, model), category (id, name). Null when unmapped.
- Fallback labels: humanized SimHub ids.

### F3. Bests rpc
*As a viewer, I want every lap and sector compared with the right bests.*

- New rpc, e.g. `get_lounge_bests(p_session_id, p_track_id, p_category_id, p_testing)`. Returns one row per track + category combination: every combination present in the session's laps, plus the live one (from F2) if given.
- Each row: app-wide best lap, app-wide best S1 / S2 / S3, session best lap, session best S1 / S2 / S3. Nulls when there is nothing to compare with.
- `p_session_id` null (no active session): app-wide bests only.
- Read-only, executable by `authenticated` only; revoke from `public, anon`.
- Check the query plan on a realistic seed; add an index on `lap_time` if it helps (track + car, filtered by the test flag).

### F4. Load additions
*As the UI streams, we want everything we need computed on the server.*

- Bests from F3, keyed by track + category, so each lap can find its own.
- For the latest lap of the active session: `ageMs`, computed on the server. Null when there is no active session or no lap.
- `statsAgeMs` for the sim session stats and the live lap stats (from `statsUpdatedAt`), computed on the server.
- The session's laps carry track and car ids plus category id, so the list can look up bests and group.

### F5. Pace classification, constants, colour tokens
*As the UI streams, we want one implementation of the colour ladder.*

- `classifyPace(time, bests, kind)` → `'record' | 'sessionBest' | 'onPace' | 'offPace' | 'neutral'`. `kind` is lap or S1 / S2 / S3. Unit tests cover each step of the ladder, ties, nulls and the band edge.
- `$lib/config/lounge.ts` with the constants from Decision 7. Proposed `STATS_STALE_AFTER_S = 120`.
- CSS tokens for the four pace colours and their undertones, plus the delta colours (lime, pink-red) and invalid red. Dark theme values; light theme gets a sensible mapping.
- One shared label map: `record` → "Track Record", `sessionBest` → "Session best", `onPace` → "On pace".

### F6. Separator component
*As the list and the session card, we want one separator look.*

- Grey text label with a horizontal line, as in the list design. Used by S and C.

### F7. `zSessionStats` fixes and the `rainIntensity` rename
*As the overlay, I want field names spelled the way SimHub spells them.*

- `rainIntesity` → `rainIntensity` in the schema, the endpoint, the fake rig and `docs/rig-endpoints.md`.
- **Coordinated with Alex:** the overlay config changes in the same release. Until then the endpoint answers `rejected` for the old name.
- `rainIntensities` lists each value once.
- `SessionTypeName` keeps strings and numbers (that's what SimHub sends); the humanizer maps `7` → "Hotstint", `8` → "Superpole", unknown → "Session".

### F8. Seed and fake rig for the new states
*As the developer, I want every new state reproducible locally.*

- Seed: a session with two tracks and two cars (one shared category at one track), app-wide record laps in other sessions, a lap without sectors, enough laps to produce every colour.
- Fake rig scenarios:
  - live stats in sector 1, 2 and 3;
  - a new lap followed by a load within 20 s (freeze);
  - session stats whose `statsUpdatedAt` is older than `STATS_STALE_AFTER_S` (stale; may need a direct SQL update in the scenario);
  - live and session stats for an unmapped car.

---

## Live lap (L)

UI only. Owns `LiveLapCard.svelte`.

### L1. Current sector and split
*As a viewer, I want to see the time in the sector being driven, in the right tile.*

- `currentSector` (1–3) decides which tile is in progress. `currentSplit` is shown in that tile, neutral (white or grey).
- Completed sectors of this lap (`s1_ms`, `s2_ms`) show their time.
- Future sectors show "–".

### L2. Sector colours
*As a viewer, I want to see at a glance whether each completed sector was quick.*

- Completed sectors take their colour from `classifyPace` with the bests of the live track + category (F2 / F3). The colour is shown as the tile's bar.
- The sector in progress, and every sector when there is no mapping or no best, stays neutral.
- `bestSx_ms` from the live stats is not used.

### L3. Invalid lap
- Lap time in invalid red, plus the existing "Invalid" badge.
- Sector colours still apply.

### L4. Freeze frame
*As a viewer, I want the card to pause on a lap that just finished, so I can see all three sectors.*

- Implements Decision 5.
- Frozen content: "Lap n" (session lap number), the final lap time, the lap's pace badge (Decision 1), three sector tiles with all three times coloured, full progress bar.
- "Show live lap" button at the bottom; background fill over `FREEZE_DURATION_S`; countdown text with `prefers-reduced-motion`.
- The set of seen lap ids survives Refresh (component state, not a fresh mount).

### L5. Delta badge colours
- Lime green when faster, pink-red when slower (tokens from F5). The delta itself is unchanged.

Progress bar: unchanged.

---

## Session laps (S)

UI only. Owns `SessionLaps.svelte`.

### S1. Two views and the toggle
*As a viewer, I want a compact list when I just want the highlights.*

- Icon toggle to the right of the section title: compact (list) and table. Default compact. Persisted (Decision 9).
- **Compact:** no header. Each row:
  - lap number, greyed out;
  - lap time, slightly larger;
  - inline crown, purple or blue, for `record` / `sessionBest` (none for green or yellow);
  - three dots on the right edge, coloured by sector pace; grey when the lap has no sectors.
- **Table:** a header row: #, Time, S1, S2, S3. Columns aligned like a table. Each row:
  - lap number, greyed out;
  - lap time;
  - S1, S2, S3: full times, coloured text (with a dimmed coloured background if the text alone is too little colour); "–" when missing;
  - under the time, a badges area (inline, wrapping): the pace badge ("Track Record", "Session best", "On pace"; none for yellow).
- The +delta is removed from the list.

### S2. Sort
- Small text button under the title: "Recent first" / "Fastest first". Default recent first. Persisted.
- Lap numbers stay the session's chronological numbers in both sorts.

### S3. Track/car separators
*As a viewer, I want to know which track and car a group of laps belongs to without reading it on every row.*

- A pure function turns the sorted laps into groups. The page renders a separator (F6) with "Track · Car" before each group, in both views.
- **Recent first:** a separator wherever track or car differs from the previous lap. A session that goes Brands → Spa → Brands shows Brands twice.
- **Fastest first:** laps are grouped by track first (tracks ordered by their most recent lap), then sorted by time inside each track. A separator appears wherever the car changes.
- Always at least one separator, even with a single group: it's the only place track and car appear.
- Track and car are removed from the rows.

### S4. Accessibility
- Each dot and crown has an accessible label ("S1: session best", "Track Record").
- The view toggle and the sort button have labels and pressed states.

---

## Session card (C)

UI only. Owns `SessionCard.svelte`.

### C1. Collapsed by default
*As a viewer, I want the session card to stay out of the way of the live lap.*

- One line: "{Session type} at {Track} · {Make Model}", e.g. "Practice at Brands Hatch · McLaren 720S". Truncated with an ellipsis to stay on one line; losing part of the car name is fine.
- An arrow expands and collapses the card. Default collapsed. Persisted (Decision 9).
- Empty state unchanged ("Waiting for session info from the rig.").

### C2. Expanded view
Sections with the shared separator (F6):

- **Session:** session type on one line, track on the next.
- **Car:** "McLaren 720S [GT3]": make + model + category, from the catalog (F2). SimHub's `CarClass` is not used.
- **Setup**, in this order: Traction Control (TC), ABS, Brake Bias (BB).
  - TC and ABS at 0 show "Off".
  - BB is the raw SimHub value (e.g. −17): SimHub doesn't expose the percentage.
- **Conditions:**
  - Air and track temperatures on one row;
  - rain now, in 10 min and in 30 min on a separate row, humanized ("No rain", "Drizzle", "Light rain", "Medium rain", "Heavy rain", "Thunderstorm") with weather icons.
- Unmapped ids fall back to the humanized SimHub id.

### C3. Stale stats
- When the sim session stats are older than `STATS_STALE_AFTER_S`, show "Updated 12 min ago" (from `statsAgeMs`), in both states.

---

## Leftovers (X)

Independent of the lounge. Can run from day one.

### X1. Sector conversion rounding
- Check whether `convertTimeStringToMilliseconds` still multiplies a float without rounding. If so: `Math.round`, plus a test with a value that used to come out as `10861.999…`.

### X2. Sector sum tolerance
- Measure first: a query over existing laps with sectors, showing how far `s1 + s2 + s3` is from the lap time.
- Then decide: strict, or a ± tolerance in ms (a constant). Update the rejection rule and `docs/rig-endpoints.md`.

### X3. `rig-qr` bucket
- Bucket declared in the repo (config or migration): public read, no client writes.
- Seed rigs get a QR image locally.
- `docs/rig-endpoints.md` gap note removed.

### X4. SimHub id completeness check
*Launch requirement (Decision 4).*

- A query or script listing catalog cars and tracks without a SimHub id (hosted and local).
- Filling the values in hosted is a data change for Alex (SQL editor, noted in the PR).

### X5. Docs
- `docs/rig-endpoints.md`: `rainIntensity`, best sectors no longer used by the lounge, tolerance from X2, resolved open issues removed.
- Open issue 6 (poll interval) stays open unless decided.

---

## Running it with Claude Code

### Streams and order

```
X ─────────────────────────────────────────►  (from day one)
F ──────────►┬─ L ─────────►
             ├─ S ─────────►
             └─ C ─────────►
```

- **F first, as one session.** Everything else depends on its load contract, pace function and tokens. F1 (the page split) is what makes the three UI streams parallel; without it they would all edit `+page.svelte`.
- **X runs in parallel with F from the start.** It touches the rig endpoints and docs, not the lounge. One overlap: F7 and X5 both edit `docs/rig-endpoints.md`. Merge F7 first, or have X5 rebase.
- **L, S and C in parallel after F is merged.** Each owns one component file and is UI only. Merge in any order.

This is your four-way split, with the shared work pulled into F so the three component streams don't each re-derive the mapping and the bests.

### Practical notes for parallel sessions

- **One worktree per stream** (`isolation: worktree` or `git worktree`), one branch each (`feat/lounge-live-lap`, …), one PR each into `preview`.
- **One local Supabase stack.** `supabase db reset` from one worktree wipes the database for all of them. Only F and X change the database. Don't run them at the same time as other resets, and run L, S and C against the database F leaves behind.
- **Migrations from parallel branches:** F and X may each create a migration. Check the timestamps after merging; rename if they're out of order, then reset.
- **Dev server ports:** run each worktree's `pnpm dev` on its own port.
- **Each session starts from:** `CLAUDE.md`, this doc, `docs/sprints/lounge-brief.md` (the contract from F1) and its own stream section. It touches only the files its stream owns.
- **Done for every story:** `pnpm check` and `pnpm lint` clean, the relevant fake rig scenario passes, a mobile-width screenshot of the component.

### Session briefs

| Session | Owns | Must not touch | Starts after |
|---|---|---|---|
| F | lounge load, `$lib/queries/rig.ts`, migrations, `$lib/config/lounge.ts`, `$lib/pace/*`, tokens, separator, `$lib/types/rig.ts`, rig endpoints (F7), seed, fake rig | — | — |
| X | `$lib/server/rigs/*` (validation), migrations (bucket), `docs/rig-endpoints.md`, scripts | lounge files | — |
| L | `LiveLapCard.svelte` (+ subcomponents) | server, types, other components | F merged |
| S | `SessionLaps.svelte` (+ subcomponents, grouping function) | server, types, other components | F merged |
| C | `SessionCard.svelte` (+ subcomponents) | server, types, other components | F merged |

---

## Suggested order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8, with X1–X5 alongside. Then L, S and C in parallel.

**Cut line:**
- Cannot slip: F (all), L1–L4, S1, S3, X1 (if the bug is still there), X4.
- Can slip: the fill animation of the "Show live lap" button (a plain button that auto-dismisses is enough), S2, C3, X2 (stay strict), X3.

## Demo script

1. Run the fake rig: live stats in sector 1, then 2, then 3. The split moves across the tiles; completed sectors take colours.
2. Send a lap and refresh within 20 s: the card freezes on the finished lap with three coloured sectors and its badge; the button fills, then the live lap returns. Refresh again: no second freeze.
3. Send an invalid live lap: red lap time, Invalid badge, sector colours still there.
4. Session laps: switch between compact and table, sort fastest first, see the separators when the car changes. Reload the page: choices kept.
5. Session card: collapsed line with the catalog car name; expand it: sections, "Off" for TC 0, forecasts with icons. Make the stats stale: "Updated n min ago".
6. Send stats with an unmapped car: humanized fallback names, neutral colours, no errors.
7. Run the SimHub id check: no missing ids locally.

## Manual decisions (for Alex)

- **Icons for the view toggle.** Candidates from lucide: `List` (compact) and `Table` or `Sheet` (table).
- **Crown icon:** `Crown`, the same as the Leaders nav. Settled as fine in both places.
- **Colour pass:** final values for the four pace colours and undertones, the delta lime / pink-red, invalid red, and text tints for coloured sector text (purple and blue text on a dark card may fail contrast). Colour-blind simulation, especially blue vs purple.
- **"Track Record" badge** may be too long on a phone; check the copy.
- **`STATS_STALE_AFTER_S`:** 120 s proposed.
- **`PACE_BAND`:** 1% for now; revisit after real laps.
- **Delta badge source:** `deltaBest` is SimHub's delta to *its* best lap, while everything else now uses the database's bests. Kept for now because it's the only live delta available. Decide whether to keep it, relabel it, or replace it once realtime makes a computed delta possible.

## Notes for Sprint 2 (realtime)

- Re-fetch the bests only on a new lap or a track/car change, not on every live stats update (Decision 6).
- The freeze becomes "a lap arrived" instead of "a lap is less than 20 s old at load". The seen-laps rule still applies.
- `statsAgeMs` becomes a ticking client value.
