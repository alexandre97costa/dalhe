# Lounge load contract (Sprint 1.5)

Replaces the contract in `sprint-1-lounge-brief.md`. The UI streams (L, S, C) build only from this: they read `data` and never fetch, query or change the load. If a stream needs more data, that goes back to F.

- Load: `src/routes/(authorized)/connect/[slug]/lounge/+page.server.ts`
- Type: `LoungePageData` in `src/lib/types/lounge.ts` (also re-exports `SessionLap`, `LatestLap`, `SimMapping`, `LoungeBests`, `BestsByKey`, `Pace`, `PaceKind`)
- Queries: `src/lib/queries/rig.ts`; bests rpc: `get_lounge_bests` (`supabase/migrations/20261030214753_lounge_bests.sql`)

Times are integer milliseconds unless stated. Ages are computed on the server at load time (server clock) and are never negative.

## Page composition

`+page.svelte` is a thin shell: header (back, rig name, driver line, Refresh), then, with an active session, `SessionCard`, `LiveLapCard`, `SessionLaps`, Disconnect (driver only); always the unclaimed list (`LapList.svelte`). Without an active session the empty state replaces the three cards. The new-lap banner is gone.

| Component            | Owner | Props (from `data`)                                                                  |
| -------------------- | ----- | ------------------------------------------------------------------------------------ |
| `SessionCard.svelte` | C     | `simSession`, `simMapping`, `statsAgeMs={data.statsAgeMs.simSession}`                |
| `LiveLapCard.svelte` | L     | `liveLap`, `liveBests`, `latestLap`, `bests`, `statsAgeMs={data.statsAgeMs.liveLap}` |
| `SessionLaps.svelte` | S     | `laps={data.sessionLaps}`, `bests`                                                   |

Refresh is `invalidateAll()`: the components stay mounted, so component state (seen laps for the freeze, collapsed state) survives it.

## `LoungePageData`

| Field             | Type                                                      | Meaning                                                                                                                                                                                                                     |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rig`             | `{ id: string; name: string }`                            | The rig (UUID, name).                                                                                                                                                                                                       |
| `status`          | `RigStatus`                                               | `rig_id, rig_name, session_active, session_id, driver_id, driver_name`. Lazy expiry: an expired session is `session_active = false`. Session and driver fields null without one; driver null for an anonymous session.      |
| `isDriver`        | `boolean`                                                 | The viewer drives the active session (shows Disconnect).                                                                                                                                                                    |
| `simSession`      | `SessionStats \| null`                                    | Latest `/send/session` (SimHub field names, see below). Null without an active session or before the first send.                                                                                                            |
| `liveLap`         | `LapStats \| null`                                        | Latest `/send/live`. Null like `simSession`.                                                                                                                                                                                |
| `statsUpdatedAt`  | `{ simSession: string \| null; liveLap: string \| null }` | ISO timestamps of the last sends.                                                                                                                                                                                           |
| `statsAgeMs`      | `{ simSession: number \| null; liveLap: number \| null }` | Age of each at load time. Stale when `> STATS_STALE_AFTER_S * 1000`. Null without stats.                                                                                                                                    |
| `simMapping`      | `SimMapping \| null`                                      | `simSession`'s `TrackId` / `CarId` mapped to the catalog. Null without `simSession`.                                                                                                                                        |
| `bests`           | `BestsByKey`                                              | Bests per track + category, key `` `${trackId}:${categoryId}` `` (e.g. `"3:1"`). Every combination in the session's laps plus the live one. `{}` without a session and without a mapping.                                   |
| `liveBests`       | `LoungeBests \| null`                                     | The bests of the live track + category (from `simMapping`). Null when the track or car is unmapped, or without `simSession`: everything on the live lap is then neutral.                                                    |
| `sessionLaps`     | `SessionLap[]`                                            | The active session's laps, **newest first**, at most 100. Empty without a session. Follows the test flag.                                                                                                                   |
| `sessionLapCount` | `number`                                                  | All laps of the session (past the 100 cap). 0 without one.                                                                                                                                                                  |
| `latestLap`       | `LatestLap \| null`                                       | `sessionLaps[0]` plus `ageMs` (ms since its `createdAt`). Null without a session or laps. Freeze when `ageMs <= FREEZE_WINDOW_S * 1000`.                                                                                    |
| `unclaimedLaps`   | `LoungeLap[]`                                             | Unchanged from Sprint 1: laps with no driver, not dismissed, newest first, at most 50 (nested shape: `time_milliseconds`, `sector1_ms`…, `car { model, car_make { name }, car_category { name } }`, `race_track { name }`). |

### `SessionLap`

Flat, one per lap of the active session.

| Field                          | Type                               | Meaning                                                                                            |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                           | `number`                           | `lap_time.id`; use as the `{#each}` key and for "seen" laps.                                       |
| `lapNumber`                    | `number`                           | Chronological number in the session: oldest = 1, newest = `sessionLapCount`. Use it in every sort. |
| `timeMs`                       | `number`                           | Lap time.                                                                                          |
| `s1Ms`, `s2Ms`, `s3Ms`         | `number \| null`                   | Sectors; null on legacy laps without sectors (show "–", grey dots).                                |
| `createdAt`                    | `string`                           | ISO timestamp the lap was stored.                                                                  |
| `driverName`                   | `string \| null`                   | Username; null in an anonymous session.                                                            |
| `trackId`, `trackName`         | `number`, `string`                 | Catalog track ("Brands Hatch").                                                                    |
| `carId`, `carMake`, `carModel` | `number`, `string`, `string`       | Catalog car ("McLaren", "720S Evo").                                                               |
| `categoryId`, `categoryName`   | `number \| null`, `string \| null` | Car category ("GT3"); null only if a catalog car has no category (then no bests).                  |

`LatestLap = SessionLap & { ageMs: number }`.

### `SimMapping`

| Field             | Type                                                  | Meaning                                                                                 |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `track`           | `{ id: number; name: string } \| null`                | Through `race_track.simhub_trackid`; null when unmapped.                                |
| `car`             | `{ id: number; make: string; model: string } \| null` | Through `car.simhub_carid`; null when unmapped.                                         |
| `category`        | `{ id: number; name: string } \| null`                | The mapped car's category; null when the car is unmapped.                               |
| `labels.track`    | `string`                                              | Catalog name, or the humanized SimHub id (`brands_hatch` → "Brands Hatch").             |
| `labels.car`      | `string`                                              | "Make Model" ("McLaren 720S Evo"), or the humanized SimHub id ("Fake Unmapped Gt3").    |
| `labels.category` | `string \| null`                                      | Catalog category name; null when the car is unmapped (SimHub's `CarClass` is not used). |

`car_simhub_carid_key` and `race_track_simhub_trackid_key` (unique) already exist in `20261027001333_remote_schema.sql`, so no migration was needed for F2.

### `LoungeBests` (one per track + category)

```ts
type BestTimes = { lap: number | null; s1: number | null; s2: number | null; s3: number | null };
type LoungeBests = { trackId: number; categoryId: number; record: BestTimes; session: BestTimes };
```

- `record`: app-wide bests (purple). Like the leaderboards: laps with a driver (unclaimed laps don't hold records), not dismissed, same test flag. Sector bests are the best ever per sector, from any lap.
- `session`: the current session's bests (blue, and the base of the green band). All laps of the session with the same test flag. All null without a session.
- Nulls are skipped: sector bests come from laps with sectors; lap bests count every lap. A best is null when there is nothing to compare with.
- Colour now, not at the time: every lap is compared with today's bests.

### `SessionStats` / `LapStats` (unchanged except the rename)

`src/lib/types/rig.ts`. `SessionStats`: `CurrentGame`, `TrackId`, `SessionTypeName` (`'PRACTICE' | 'HOTLAP' | 'RACE' | 7 | 8`), `CarId`, `CarClass?`, `TCLevel` (0 = off), `ABSLevel` (0 = off), `BrakeBias` (raw SimHub value, e.g. −17), `AirTemperature`, `TrackTemperature` (°C), `rainIntensity`, `rainIntensityIn10min`, `rainIntensityIn30min` (`ACC_NO_RAIN` … `ACC_THUNDERSTORM`). **`rainIntensity` was `rainIntesity`**; stats stored before the rename may lack it at runtime, so treat it as possibly undefined (`rainLabel` returns null).

`LapStats`: `lapNumber`, `lapTotalCount?`, `laptime_ms` (running lap time), `deltaBest` (**seconds**, SimHub's delta to its own best), `progress` (0–1), `valid`, `currentSector` (1–3), `currentSplit` (ms; the seed and fake rig send the time so far in the current sector), `s1_ms?`, `s2_ms?` (completed sectors of this lap), `bestS1_ms?`…`bestS3_ms?` (no longer used by the lounge).

## Helpers

| Module                                           | Exports                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$lib/pace`                                      | `classifyPace(time, bests, kind, band?)` → `'record' \| 'sessionBest' \| 'onPace' \| 'offPace' \| 'neutral'`; `classifyLap(lap, bests)` → pace per `lap`/`s1`/`s2`/`s3`; `bestsKey(trackId, categoryId)`; `bestsFor(bests, { trackId, categoryId })` → `LoungeBests \| null`; `hasPaceBadge(pace)` |
| `$lib/pace/labels`                               | `paceLabel(pace)` → "Track Record" / "Session best" / "On pace" / null; `paceAriaLabel(pace)` (lower case, every pace); `sectorAriaLabel('s1', pace, hasTime?)` → "S1: session best"                                                                                                               |
| `$lib/pace/classes`                              | `paceBg`, `paceText`, `paceUndertoneBg`: Tailwind classes per pace                                                                                                                                                                                                                                 |
| `$lib/config/lounge`                             | `FREEZE_WINDOW_S = 20`, `FREEZE_DURATION_S = 5`, `PACE_BAND = 0.01`, `STATS_STALE_AFTER_S = 120`                                                                                                                                                                                                   |
| `$lib/utils/simhub`                              | `humanizeSimhubId(id)`, `sessionTypeLabel(type)` (7 → Hotstint, 8 → Superpole, unknown → Session), `rainLabel(rain)`, `rainLevel(rain)` (0–5, for icons)                                                                                                                                           |
| `$lib/components/lounge/LabeledSeparator.svelte` | `label` (or a `children` snippet), `class`: grey text + horizontal line                                                                                                                                                                                                                            |

Typical use:

```ts
import { bestsFor, classifyLap, classifyPace } from '$lib/pace';
const paces = classifyLap(lap, bests); // session list: { lap, s1, s2, s3 }
const s1 = classifyPace(liveLap.s1_ms, liveBests, 's1'); // live card
const frozen = classifyLap(latestLap, bests); // freeze frame
```

Ladder (first match wins; ties use ≤): null time or no bests → neutral; ≤ record → record; no session best → neutral; ≤ session best → sessionBest; ≤ session best × (1 + `PACE_BAND`) → onPace; else offPace.

## Colour tokens

CSS custom properties in `src/app.css` (dark in `.dark`, light mapping in `:root`), exposed to Tailwind:

| Token                                       | Tailwind                                                         | Use                                |
| ------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `--pace-record` / `--pace-record-undertone` | `bg-pace-record`, `text-pace-record`, `bg-pace-record-undertone` | Purple, violet undertone           |
| `--pace-session-best` / `-undertone`        | `…-pace-session-best…`                                           | Blue, violet undertone             |
| `--pace-on-pace` / `-undertone`             | `…-pace-on-pace…`                                                | Green, teal undertone              |
| `--pace-off-pace` / `-undertone`            | `…-pace-off-pace…`                                               | Yellow, orange undertone           |
| `--pace-neutral` / `-undertone`             | `…-pace-neutral…`                                                | White/grey                         |
| `--delta-faster`, `--delta-slower`          | `bg-delta-faster`, `text-delta-slower`…                          | Live delta badge (lime / pink-red) |
| `--lap-invalid`                             | `text-lap-invalid`                                               | Invalid lap time                   |

Values are placeholders until the colour pass.

## Message keys (en + pt in `messages/*.json`)

- Pace: `lounge_pace_record`, `lounge_pace_session_best`, `lounge_pace_on_pace`; accessible: `lounge_pace_aria_record`, `lounge_pace_aria_session_best`, `lounge_pace_aria_on_pace`, `lounge_pace_aria_off_pace`, `lounge_pace_aria_neutral`, `lounge_pace_aria_no_time`, `lounge_sector_aria` (`S{sector}: {pace}`).
- Freeze: `lounge_show_live_lap`, `lounge_show_live_lap_countdown` (`{seconds}`). Lap header: existing `lounge_lap_number` (`{lap}`), `lounge_lap_number_of`.
- Session laps: `lounge_lap_view_label`, `lounge_lap_view_compact`, `lounge_lap_view_table`, `lounge_lap_sort_label`, `lounge_lap_sort_recent`, `lounge_lap_sort_fastest`, `lounge_lap_col_number`, `lounge_lap_col_time`, `lounge_lap_no_sectors`; existing `lounge_session_laps`, `lounge_session_laps_empty`.
- Session card: `lounge_session_line` (`{sessionType} at {track}`), `lounge_session_expand`, `lounge_session_collapse`, `lounge_section_session`, `lounge_section_car`, `lounge_section_setup`, `lounge_section_conditions`, `lounge_setup_tc`, `lounge_setup_tc_short`, `lounge_setup_abs`, `lounge_setup_bb`, `lounge_setup_bb_short`, `lounge_setup_off`, `lounge_rain_now`, `lounge_rain_in_10`, `lounge_rain_in_30`, `lounge_stats_updated_ago` (`{minutes}`); existing `lounge_air_temp`, `lounge_track_temp`, `lounge_sim_session_empty`.
- Used by the humanizers: `lounge_rain_none` … `lounge_rain_thunderstorm`, `lounge_session_type_practice` … `lounge_session_type_unknown`.

## Local states (seed + fake rig)

After `pnpm db:reset`, Garagem (`/connect/b0000000-0000-4000-8000-000000000002/lounge`) has Carla's active session: 8 laps Brands → Spa → Brands, two GT3 cars at Brands, a lap without sectors, every pace colour; mapped live stats in sector 2. The session expires `SESSION_TIMEOUT_MINS` after the reset. Fake rig (`pnpm rig <name>`): `live-sector-1|2|3`, `freeze` (load within 20 s), `stats-stale`, `unmapped-car`, `stats-old-rain-name`.
