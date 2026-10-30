# Dá-lhe! lounge room: current state (after Sprint 1)

Context for planning lounge changes. Describes the page as merged into `preview` (PR #24), the data it receives, and which fields are available but not shown yet.

## What the page is

`/connect/[rigId]/lounge` shows the live state of one rig. Anyone logged in can open it: the driver (after Connect) or a spectator ("Just watch"). Mobile first, dark theme, shadcn-svelte components. Everything comes from one server load; components don't fetch data. There is **no realtime yet**: a Refresh button reloads the data (realtime on `rig_stats` is planned for Waterfall 2).

## How data gets there

- The SimHub overlay calls the rig endpoints with the rig's secret key:
  - `/send/new`: a finished lap. Stored in `lap_time`, in the rig's active session, under its driver. If nobody is connected, the lap is stored with no driver, in an anonymous session ("unclaimed").
  - `/send/live`: the current lap in progress. Only the latest value is kept, in `rig_stats.lap_stats`.
  - `/send/session`: the sim session (car, track, conditions). Only the latest value is kept, in `rig_stats.session_stats`.
- Stats are stored only while the rig has an active session; otherwise they're ignored. Connecting or disconnecting clears the rig's stats.
- A session is active while it's open and its last lap or connect was within `SESSION_TIMEOUT_MINS` (120 min locally). There's no history of live stats: each send overwrites the previous one.

## Layout, top to bottom

1. **Header**
   - Back arrow to the connect page.
   - Rig name.
   - Status line, which is one of: "Nobody is driving", "You are driving", "alice is driving", or "Anonymous driver".
   - Refresh button, which spins while reloading.
2. **No session** (instead of 3–7): an empty state ("Nobody is driving / Connect to start a session…") with a Connect to Rig button.
3. **New-lap banner**: the newest lap of the session, as a time (1:30.782), then driver · track · "Just now". It's simply the latest lap; there's no timing or animation logic.
4. **Session card** (collapsible; the chevron hides the extra badges):
   - Title: the track, from SimHub's id, humanized (`brands_hatch` → "Brands Hatch").
   - Always visible: a car badge (SimHub id humanized: "Porsche 991ii Gt3 R") and a car class badge (GT3).
   - Collapsible badges:
     - session type (Practice / Hotlap / Race / Hotstint / Superpole);
     - TC n, ABS n, BB n (brake bias);
     - Air n°C, Track n°C;
     - current rain ("No Rain").
   - Empty state: "Waiting for session info from the rig."
5. **Live lap card**
   - Header: "Lap 6/20", or "Lap 6" when there's no total. A delta badge on the right (−0.210): teal when faster, red when slower. An "Invalid" badge when the lap is invalid.
   - Big running lap time (41.230).
   - Progress bar, from `progress` (0–1).
   - Three sector tiles, S1 S2 S3:
     - a completed sector shows its time;
     - the current sector shows the time elapsed in it, with a highlighted border;
     - a future sector shows "–".
     - Each tile has a colour bar: purple when the completed sector is ≤ the best for that sector, otherwise muted.
   - Empty state: "Waiting for the car to hit the track."
6. **Session laps**: every lap of the current session, newest first, numbered (3, 2, 1). Each row has:
   - the lap time;
   - a "Best" badge on the session's fastest lap, or the +delta to it on the others;
   - S1 S2 S3;
   - track · car make + model, from the catalog ("Porsche 911 II").
7. **Disconnect from Rig** button, shown only to the current driver.
8. **Unclaimed laps** (always shown, even without a session): laps driven on this rig with nobody connected, not claimed or dismissed, newest first. Each row has the time, sectors, and track · car · time ago. Read-only for now (claiming is Sprint 3).

## Data types

### Sim session stats: `SessionStats` (`zSessionStats` in `src/lib/types/rig.ts`)

Field names are SimHub's. The whole object is optional on the page (`null` = no stats yet).

| Field | Type | Shown? |
| --- | --- | --- |
| `CurrentGame` | `'AssettoCorsaCompetizione'` | no |
| `TrackId` | string (SimHub id, `brands_hatch`) | card title |
| `SessionTypeName` | `'PRACTICE' \| 'HOTLAP' \| 'RACE' \| 7 (hotstint) \| 8 (superpole)` | badge |
| `CarId` | string (SimHub id, `audi_r8_lms_evo`) | badge (humanized id) |
| `CarClass` | string, optional (GT3) | badge |
| `TCLevel` | int ≥ 0 (0 = off) | badge |
| `ABSLevel` | int ≥ 0 (0 = off) | badge |
| `BrakeBias` | int (−17) | badge |
| `AirTemperature` | int °C | badge |
| `TrackTemperature` | int °C | badge |
| `rainIntesity` | `ACC_NO_RAIN \| ACC_DRIZZLE \| ACC_LIGHT_RAIN \| ACC_MEDIUM_RAIN \| ACC_HEAVY_RAIN \| ACC_THUNDERSTORM` | badge |
| `rainIntensityIn10min` | same | **no** |
| `rainIntensityIn30min` | same | **no** |

Also available: `statsUpdatedAt.simSession`, the time of the last `/send/session`. **Not shown.**

### Live lap: `LapStats` (`zLapStats` in `src/lib/types/rig.ts`)

| Field | Type | Shown? |
| --- | --- | --- |
| `lapNumber` | int ≥ 0 | "Lap n" |
| `lapTotalCount` | int, optional | "/ total" |
| `laptime_ms` | int ms, running time of the current lap | big time |
| `deltaBest` | number, **seconds**, vs best lap | delta badge |
| `progress` | 0–1, position in the lap | progress bar |
| `valid` | boolean | "Invalid" badge |
| `currentSector` | 1–3 | highlighted tile |
| `currentSplit` | int ms | **no** |
| `s1_ms`, `s2_ms` | int ms, optional, completed sectors of this lap | sector tiles |
| `bestS1_ms`, `bestS2_ms`, `bestS3_ms` | int ms, optional, best sectors | purple bar only (the values themselves aren't shown) |

Also available: `statsUpdatedAt.liveLap`, the time of the last `/send/live`. **Not shown.** There's no S3 for the lap in progress, because a lap ends when S3 completes. The finished lap then arrives via `/send/new`.

### Session laps and unclaimed laps: `LoungeLap` (`src/lib/queries/rig.ts`)

| Field | Type | Shown? |
| --- | --- | --- |
| `id` | number | (key) |
| `time_milliseconds` | int ms | lap time |
| `sector1_ms`, `sector2_ms`, `sector3_ms` | int ms, nullable | S1 S2 S3 |
| `created_at` | timestamp | banner "Just now", unclaimed "x ago" |
| `driver.username` | string or null (unclaimed) | banner only |
| `car.model`, `car.car_make.name` | strings | "Porsche 911 II" |
| `car.car_category.name` | string (GT3…) | **no** |
| `race_track.name` | string | track |

Computed on the page: the session best (minimum time), each lap's delta to it, and the lap number (count from the oldest).

Session laps are capped at 100 per session; unclaimed laps at 50. Both respect the test flag (`for_testing`).

### Rig status: `RigStatus`

`rig_id`, `rig_name`, `session_active`, `session_id`, `driver_id`, `driver_name` (username). The page also gets `isDriver` (the viewer is the current driver).

## In the database but not loaded by the lounge (yet)

These would need a query change, not a schema change:

- `lap_time`:
  - `wet` (boolean);
  - `was_podium` (top 3 on the track when set);
  - `pole_rating` (track dominance: +1 for every later lap by others that doesn't beat it);
  - `rig_id`, `session_id`;
  - `tournament_id`, `game_id`;
  - `driver_assigned_by` / `driver_assigned_at` (claiming);
  - `dismissed_at`.
- `car`: `year`, `simhub_carid` (could map the session card's SimHub `CarId` to the catalog name), `category_id`.
- `car_make`: `logo` (bytea).
- `race_track`: `location`, `length`, `country_code` (flags), `simhub_trackid` (could map `TrackId` to the catalog name).
- `reference_time`: a reference lap time per track + car category + game. Usable for "x% off reference".
- `rig_session`: `started_at`, `last_activity_at` (session duration, "last lap n min ago").
- Existing rpcs:
  - `get_leaderboard_by_track(track, category, testing)`: track record and ranks;
  - `get_driver_timeline(driver, testing)`: personal bests, previous lap time, track record flags.

## Known nits

- The session card shows the car from SimHub's id ("Porsche 991ii Gt3 R"), while the lap lists show the catalog name ("Porsche 911 II"). The track is similar. Mapping through `car.simhub_carid` / `race_track.simhub_trackid` would make them match.
- The sector tiles show the time without the best sector next to it; best sectors are only used for the purple bar.
- The page updates only on Refresh (no realtime, no auto-refresh).
- The overlay field is spelled `rainIntesity` (sic); kept as SimHub sends it.
