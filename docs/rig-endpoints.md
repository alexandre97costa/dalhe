# Rig entrypoint documentation

This entrypoint is reserved for rigs with the `Dá-lhe!` SimHub dashboard that are trying to communicate with the `Dá-lhe!` app. There is no user login: the rig identifies itself with two values, both pre-created in the database and inserted into the plugin's files.

- The rig's **UUID**, in the URL slug (`/rig/[uuid]/...`). It is public: the QR code, connect and lounge URLs all contain it.
- The rig's **api key**, as the `k` query param on every request (`/rig/[uuid]?k=...`). It is secret: it lives only in the `rig_key` table (service role only) and the overlay config, and the app never returns or logs it.

An unknown rig, a malformed UUID, and a missing or wrong key all get the same `404 {"error": "not_found"}`, so a caller can't tell whether a rig exists. Seeing the QR code is not enough to submit laps; that needs the key from the rig PC. See [Sprint 1, Decision 1](sprints/sprint-1.md) for why.

Because of limitations with dashboard development, Simhub can only send GET requests. This means publications of laptimes are made with said GET requests. The entrypoints are fairly protected against duplicate requests, and try to fail gracefully instead of error-ing, so that the SimHub overlay doesn't cache an error to that call, effectively blocking future requests.

The main entrypoint is going to be timely polled when SimHub is running the dashboard, and simply asks what's the rig name in the app, and who's driving. It never writes to the database and never returns ids.

`GET /rig/[uuid]?k=...` answers `200` with:

| Case                                                                                  | Body                                                                   |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Someone connected                                                                     | `{"rigName": "Garagem", "sessionActive": true, "driverName": "carla"}` |
| Anonymous session (laps arrived, nobody connected)                                    | `{"rigName": "Garagem", "sessionActive": true, "driverName": null}`    |
| No session, or the last one expired (`SESSION_TIMEOUT_MINS` without a lap or connect) | `{"rigName": "Garagem", "sessionActive": false, "driverName": null}`   |

`driverName` is the driver's username, as everywhere else in the app.

The overlay will feature a QR code when its not in a race, so that drivers can connect to it through the mobile app. The scan will take users to an authorized page, which means it will prompt the user to login first in order to connect to a rig. If the user is already connected, the QR code will take them to the connect page which is an entrance hall to the lounge room. It lets you either connect to the rig or spectate it - connecting in will log out other drivers that were connected previously.

The rig (or rather, the simhub dashboard) will also send some other requests under certain conditions, all under the `/send/*` route.

- `/live`: will send information about the current lap. Current lap time, split, delta to the best time, and sector times.
- `/session`: will send information about the current session. Track name, car name, car category, weather info, etc. This won't be updated as fast as `/live`.
- `/new`: This request is the only one that needs an event set up in order to function. When a new _valid_ lap is made, the dashboard will send a request with the complete information of this last lap that was made - laptime, sector times, the works.

## Response contract

The overlay retries a lap until it is handled, so every handled outcome returns **200** with a `status` (Sprint 1, Decision 5). Only "never got here" is non-200. Bodies use camelCase.

| Response       | When                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `404`          | Unknown rig, malformed UUID, missing or wrong key (same body for all).                                                                               |
| `200` + status | Laps (`/send/new`): `created` (with `lapId`), `duplicate`, `rejected` (with a `reason`: invalid params, sectors don't add up, unknown car or track). |
| `200` + status | Stats (`/send/live`, `/send/session`): `ok`, `ignored` (no active session), `rejected` (invalid params).                                             |
| `5xx`          | Server error; the overlay may retry.                                                                                                                 |

### Laps: `/send/new`

`GET /rig/[uuid]/send/new?laptime_ms=87898&s1_time=00:00:29.1650000&s2_time=00:00:31.3180000&s3_time=00:00:27.4150000&carId=porsche_991ii_gt3_r&trackId=brands_hatch&k=...`

`carId` and `trackId` are SimHub's ids (`car.simhub_carid`, `race_track.simhub_trackid`), not database ids.

| Body                                                   | Meaning                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `{"status": "created", "lapId": 131}`                  | Stored in the rig's active session (or a new anonymous one) under its driver. Refreshes the session's activity.          |
| `{"status": "duplicate"}`                              | The same lap (track, car, time, sectors) is already stored. Nothing is written: no row, no session, no activity refresh. |
| `{"status": "rejected", "reason": "invalid_params"}`   | A param is missing or malformed.                                                                                         |
| `{"status": "rejected", "reason": "sectors_mismatch"}` | The sectors don't add up to `laptime_ms`.                                                                                |
| `{"status": "rejected", "reason": "unknown_car"}`      | `carId` isn't in the catalog.                                                                                            |
| `{"status": "rejected", "reason": "unknown_track"}`    | `trackId` isn't in the catalog.                                                                                          |
| `500 {"error": "server_error"}`                        | Not handled; retry.                                                                                                      |

**Sector sum: strict.** Each sector is converted to whole milliseconds (rounded), and `s1 + s2 + s3` must equal `laptime_ms` exactly, with no tolerance. Sprint 1.5 (X2) set out to measure the drift on real laps, but no stored lap had sectors yet. If real laps get `sectors_mismatch` by a millisecond or two, add a tolerance constant next to the check in `submitLap` and note it here.

Rejected laps are logged on the server with their params (never the key), so a lap on a car or track missing from the catalog can be added by hand once the catalog has it.

Every car and track in use needs its SimHub id. `pnpm simhub:check` lists catalog cars and tracks without one (and how many laps each has) on the local stack, read-only. For hosted, run the SQL at the top of `scripts/simhub-ids.mjs` in the dashboard's SQL editor.

### Stats: `/send/live` and `/send/session`

The overlay sends the current lap (`/send/live`, often) and the sim session (`/send/session`, less often) as query params. The app keeps only the latest values per rig, in `rig_stats.lap_stats` and `rig_stats.session_stats`, for the lounge. The params are validated by `zLapStats` and `zSessionStats` in `src/lib/types/rig.ts`; the key is never stored.

- `/send/live`: `lapNumber`, `lapTotalCount`?, `laptime_ms`, `deltaBest`, `progress` (0–1), `valid` (`true`/`false`), `currentSector` (1–3), `currentSplit`, and optionally `s1_ms`, `s2_ms`, `bestS1_ms`, `bestS2_ms`, `bestS3_ms`. The `bestSx_ms` values are accepted and stored but no longer used by the lounge: its bests come from the database ([Sprint 1.5, Decision 2](sprints/sprint-1.5.md)).
- `/send/session`: SimHub's names: `CurrentGame` (`AssettoCorsaCompetizione`), `TrackId`, `SessionTypeName` (`PRACTICE`, `HOTLAP`, `RACE`, `7` hotstint, `8` superpole), `CarId`, `CarClass`?, `TCLevel`, `ABSLevel`, `BrakeBias`, `AirTemperature`, `TrackTemperature`, `rainIntesity`, `rainIntensityIn10min`, `rainIntensityIn30min` (`ACC_NO_RAIN` … `ACC_THUNDERSTORM`).

| Body                                                 | Meaning                                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `{"status": "ok"}`                                   | Stored. The rig has an active session.                                             |
| `{"status": "ignored"}`                              | Nothing written: no active session (none, or past the timeout). Never creates one. |
| `{"status": "rejected", "reason": "invalid_params"}` | A param is missing or out of range.                                                |
| `500 {"error": "server_error"}`                      | Not handled.                                                                       |

Stats never refresh the session's activity: only laps and connects do. Connecting or disconnecting clears the rig's stats.

## Managing keys

- **New rig:** insert the `rig` row, then a `rig_key` row with only `rig_id` (`insert into public.rig_key (rig_id) values ('<uuid>')`). The key is generated (32 hex characters). A rig without a key row answers 404 to everything.
- **Read a key:** `select api_key from public.rig_key where rig_id = '<uuid>'` in the dashboard's SQL editor, then paste it into the overlay config.
- **Change a key** (e.g. it leaked): `update public.rig_key set api_key = encode(extensions.gen_random_bytes(16), 'hex') where rig_id = '<uuid>'`, then paste the new key into the overlay config. The UUID, QR code, URLs and lap history don't change.
- **QR image:** upload `<uuid>.png` (the connect URL, never the key) to the public `rig-qr` bucket in Studio; the overlay reads it from `<supabase url>/storage/v1/object/public/rig-qr/<uuid>.png`. Clients can't write to the bucket. Locally the seed rigs' images are uploaded on `supabase start` / `db reset`.
- **Local stack:** the seed rigs have fixed keys, `local-sala-key` (Sala) and `local-garagem-key` (Garagem).

## Testing locally: the fake rig

`pnpm rig <scenario...>` calls these endpoints the way the overlay does and prints each call (without the key), the status code, the body and PASS/FAIL against this contract. `pnpm rig` lists the scenarios, `pnpm rig all` runs them all. It targets Garagem by default (`--rig sala` for Sala) and the dev server on `http://localhost:5173` (`FAKE_RIG_URL` to change it).

It refuses to run unless both the app URL and `PUBLIC_SUPABASE_URL` are local, since these endpoints write even on GET. Some scenarios write laps and sessions; `pnpm db:reset` cleans up.
