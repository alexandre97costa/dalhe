> Superseded by [`lounge-brief.md`](lounge-brief.md) (Sprint 1.5).

# Sprint 1: lounge page brief

A prompt for building the lounge room UI, written for Copilot before Sprint 0. Moved here from `md/roadmap.md`; the data contract below was updated for Sprint 1 (B4).

Context: SvelteKit 5 (runes) + Supabase + shadcn-svelte + Tailwind. Mobile-first web app for sim racing friends/family ("Dá-lhe!").

Task: build the "Lounge room" page UI at src/routes/(authorized)/connect/\[slug\]/lounge. It shows the live state of one shared sim rig.

Data contract (do NOT fetch data in components; receive it via the page `data` prop only). Updated for Sprint 1 B4; the load is `lounge/+page.server.ts`, the queries are in `$lib/queries/rig.ts`:

- `rig`: `{ id, name }`
- `status`: one `rig_status` row: `rig_id, rig_name, session_active, session_id, driver_id, driver_name`. Lazy expiry: an expired session has `session_active = false`. Session and driver fields are null with no active session; `driver_id` / `driver_name` are also null for an anonymous session (laps driven with nobody connected).
- `isDriver`: the logged-in user drives the active session (shows Disconnect).
- `simSession`: `SessionStats | null` (`$lib/types/rig.ts`, SimHub field names: `TrackId`, `CarId`, `CarClass`, `SessionTypeName`, `TCLevel`, `ABSLevel`, `BrakeBias`, `AirTemperature`, `TrackTemperature`, rain fields). Null with no active session or before the overlay sends it. Car and track are SimHub ids, not catalog names.
- `liveLap`: `LapStats | null`: `lapNumber, lapTotalCount?, laptime_ms, deltaBest, progress (0–1), valid, currentSector, currentSplit, s1_ms?, s2_ms?, bestS1_ms?, bestS2_ms?, bestS3_ms?`. Null like `simSession`. `deltaBest` is assumed to be seconds (SimHub's live delta); A4 may refine both types.
- `statsUpdatedAt`: `{ simSession, liveLap }` timestamps, or null.
- `latestLap`: the newest lap of the active session (for the new-lap banner), or null. Same shape as the lap lists.
- `sessionLaps`: the active session's laps, newest first (empty with no session).
- `unclaimedLaps`: the rig's laps with no driver and not dismissed, newest first.
- Lap shape (`LoungeLap`): `id, time_milliseconds, sector1_ms, sector2_ms, sector3_ms, created_at, driver { username } | null, car { model, car_make { name }, car_category { name } }, race_track { name }`. Lap lists follow the test flag (`GET_TEST_RECORDS`).

Sections, top to bottom:

1. Rig header: rig name, who is driving (or "Anonymous driver")
2. Session card: car, track, plus extra stats as small badges. This card should be minimizable, showing only small badges of car and track when minimized;
3. Live Lap card: small lap number & lap total count (eg. Lap 7/52), Lap time (mm:ss.thm) with delta to best time (+m:ss). Progress bar, followed by the justified sector times. Each sector time will have a color bar, which will turn purple if is <= of sector best.
4. Recent laps list: lap time, sectors S1/S2/S3, car/track
5. Unclaimed laps list (read-only for now)

Constraints:

- Reuse existing components in /lib/components/ and in src/routes/(authorized)/connect/\[slug\]/lounge and the existing top banner; do not modify it
- Support dark mode via existing theme tokens (dark:)
- No business logic, no Supabase calls, no new dependencies
- Handle empty states (no session, no laps, no driver)
- ~~Add a mock data file for the page so it renders without a backend~~ Dropped: the local stack and the fake rig (A5) provide real data.

Existing draft to evaluate: src/routes/(authorized)/connect/\[slug\]/lounge/+page.svelte. Say what to keep and what to replace before changing anything.

## Draft evaluation (Sprint 1, B5)

The draft predates `rig_stats` and B4, so most of it reads data that no longer exists.

Keep:

- The section order and the live lap card layout: lap number, big lap time with a delta pill, progress bar, three sector tiles with a colour bar.
- The collapsible session card (`Collapsible`), minimised to car and track.
- Session best as the reference for the per-lap delta in the lap list.

Replace:

- Hard-coded hex colours (`#13131b`, `#a6a4b8`, …): dark-only and off-theme. Use theme tokens and shadcn components (`Card`, `Badge`, `Progress`, `Alert`, `Empty`).
- The untyped `Json` readers looking up keys that never existed (`trackName`, `currentLapTime`, `sectorTimes`): read the typed `SessionStats` / `LapStats`.
- The preview live lap shown when there are no stats, and the dev-only fake unclaimed laps: real data and empty states instead.
- The claim checkboxes and button: claiming is Sprint 3; unclaimed laps are read-only.
- The tabs (`?tab=`): one mobile-first scroll, sections top to bottom as above.
- The 15-second "telemetry connected" clock: no realtime yet; the header shows the driver and a Refresh button (`invalidateAll`).
- `PreviousLaps.svelte`: sectors are stored now, and both lists need car and track. Replaced by one `LapList.svelte` for session and unclaimed laps.

Added: the new-lap banner, the no-session state with a Connect link, i18n (en/pt).
