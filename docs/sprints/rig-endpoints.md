# Rig guide: setup checklist and endpoint reference

How a sim rig talks to Dá-lhe!, seen from the rig. Part 1 is the checklist for bringing a new rig online. Part 2 is the endpoint reference. Part 3 describes what the SimHub overlay does with each endpoint.

This describes the **Sprint 1 target**. Where the code isn't there yet, the story is noted (e.g. *A1*). Update this file when a story lands.

---

## The model in one paragraph

A rig is a row in `rig` with a public **UUID** and a secret **api key** (in `rig_key`). The UUID goes in the QR code and every link users see. The key lives only in the database and in the overlay config. The overlay knows both and sends them on every request. SimHub's Dash Studio can only send `GET`, so everything travels in the query string; there is no body. The app answers JSON, never cached (`Cache-Control: no-store`).

Who is driving is decided on the **phone**, not the rig: a family member scans the QR, logs in, presses Connect. The rig only *asks* who is driving (poll) and *reports* what happens (laps, stats). It never tells the app who it thinks the driver is.

---

## Part 1: New rig checklist

### 1. Database (hosted, SQL editor)

Creating a rig is a data change, so the SQL editor is allowed. Note it in the next PR.

- [ ] Create the rig. The name is unique and shows on the overlay and in the app.
  ```sql
  insert into public.rig (name) values ('Sala') returning id;
  ```
- [ ] Create its key (*A1*). 32 hex characters, URL-safe, no encoding needed.
  ```sql
  insert into public.rig_key (rig_id, api_key)
  values ('<rig uuid>', replace(gen_random_uuid()::text, '-', ''))
  returning api_key;
  ```
- [ ] Copy the UUID and the key somewhere safe (password manager). The key is never shown again by the app.
- [ ] Catalog check: every car and track you'll drive needs its SimHub id filled in (`car.simhub_carid`, `race_track.simhub_trackid`). A lap on a car or track that isn't mapped is `rejected` (the server logs it, so it can be recovered by hand, but it won't appear on its own). `pnpm simhub:check` lists the unmapped ones locally; the SQL for the hosted SQL editor is at the top of `scripts/simhub-ids.mjs`.

### 2. QR code

The QR encodes the connect URL with the UUID only. Never the key.

- [ ] Generate the image:
  ```bash
  npx qrcode -w 512 -o <rig uuid>.png "https://dalhe.pt/connect/<rig uuid>"
  ```
- [ ] Upload it to the `rig-qr` bucket as `<rig uuid>.png` (Studio → Storage).
- [ ] Open the public URL in a browser and scan it with a phone. It should land on the connect page.
  ```
  https://<project-ref>.supabase.co/storage/v1/object/public/rig-qr/<rig uuid>.png
  ```

The bucket is public on purpose: the UUID is public anyway, and the overlay can't send auth headers. It's created by the `rig_qr_bucket` migration (PNG only, 1 MiB max) and has no client write policies: upload through Studio. Locally, the seed rigs' QR images (`supabase/storage/rig-qr/`) are uploaded on `supabase start` / `db reset` (`[storage.buckets.rig-qr]` in `config.toml`).

### 3. Overlay config (on the rig PC)

- [ ] Install the Dá-lhe! dashboard in SimHub.
- [ ] Fill the config file in the overlay folder:
  ```
  baseUrl = https://dalhe.pt
  rigId   = <rig uuid>
  apiKey  = <api key>
  ```
- [ ] Bind the **NewValidLap** event to the lap-send action (see Part 3, "Send a lap").

Anyone sitting at the rig can read this file. That's accepted: the key stops people who only *saw* the QR, not people at the rig (who could just drive).

### 4. Verify

Run these in order. Each step tells you which layer is broken if it fails.

- [ ] **Poll:** with SimHub running, the overlay shows the rig name and "no driver". *Fails →* URL, UUID or key typo.
- [ ] **Wrong key:** change one character of the key, restart the dash. Overlay shows "rig not recognized". Put it back.
- [ ] **Connect:** scan the QR on the overlay, log in, press Connect. Within one poll interval the overlay shows your name.
- [ ] **Lap:** drive one valid lap. Overlay shows "Lap saved". The lap appears in the lounge room under your name.
- [ ] **Stats:** while driving, refresh the lounge room. Sim session and live lap cards are filled.
- [ ] **Disconnect:** press Disconnect in the lounge. Overlay shows "no driver". The next lap lands as unclaimed.

To test against the hosted database without polluting real leaderboards, point `baseUrl` at a **preview** deployment first: laps there are saved with the test flag. (Check that Vercel deployment protection doesn't block unauthenticated requests to the preview URL; if it does, the overlay will get an HTML login page instead of JSON.)

---

## Part 2: Endpoint reference

All endpoints:

- Method `GET`. Parameters in the query string.
- `k` = the rig's api key. Required everywhere (*A1*).
- Response is JSON, camelCase, `Cache-Control: no-store`.
- Unknown rig, malformed UUID, missing or wrong key: **`404 {"error": "not_found"}`**, the same body for all of them on purpose.
- `5xx`: server error. Safe to retry.

| Endpoint | Purpose | Trigger | Story |
|---|---|---|---|
| `/rig/{uuid}` | Who's driving | Timer | *A2* |
| `/rig/{uuid}/send/new` | New valid lap | NewValidLap event | *A3* |
| `/rig/{uuid}/send/live` | Live lap stats | Timer, while on track | *A4* |
| `/rig/{uuid}/send/session` | Sim session stats | Timer, or on change | *A4* |

### Poll: `GET /rig/{uuid}?k={key}`

Read-only. Never creates or closes anything; an expired session simply reports as inactive.

```json
{ "rigName": "Sala", "sessionActive": true, "driverName": "Alex" }
```

| `sessionActive` | `driverName` | Meaning | Overlay shows |
|---|---|---|---|
| `false` | `null` | Nobody connected, no laps recently | "No driver", QR |
| `true` | `"Alex"` | Alex connected | "Driving: Alex" |
| `true` | `null` | Anonymous session (laps arrived with nobody connected) | "No driver", QR |

No ids in the response (Decision 3).

### New lap: `GET /rig/{uuid}/send/new?k={key}&...`

| Param | Example | SimHub source |
|---|---|---|
| `laptime_ms` | `102431` | last lap time, in ms |
| `s1_time` | `00:00:34.1200000` | last lap sector 1 |
| `s2_time` | `00:00:38.0510000` | last lap sector 2 |
| `s3_time` | `00:00:30.2600000` | last lap sector 3 |
| `carId` | `mclaren_720s_gt3` | `GameData.CarId` |
| `trackId` | `brands_hatch` | `GameData.TrackId` |

Rules:

- The three sectors must add up to `laptime_ms` exactly: each sector is rounded to whole ms, no tolerance (Sprint 1.5, X2). No stored lap had sectors to measure a drift against; revisit if real laps get `sectors_mismatch` by 1–2 ms.
- The car and track must exist in the catalog (by SimHub id).
- The lap goes to whoever drives the active session. No active session: an anonymous one is created and the lap lands there, unclaimed.
- **Duplicate** = same track, car, lap time and all three sectors. Not scoped to the rig or the driver.

Responses (all `200`):

```json
{ "status": "created", "lapId": 812 }
{ "status": "duplicate" }
{ "status": "rejected", "reason": "sectors_mismatch" }
```

| Status | What happened in the database | Overlay should |
|---|---|---|
| `created` | Lap inserted; session's `last_activity_at` refreshed | Stop. Show "Lap saved" |
| `duplicate` | Nothing. Already saved earlier | Stop. Show "Lap saved" too |
| `rejected` | Nothing. Logged server-side with its params (never the key) | Stop. Show "Lap not saved" |

`duplicate` is how a retry finds out its earlier attempt worked (the response was lost, the lap wasn't), so the overlay treats it as success.

Rejection reasons: `invalid_params`, `sectors_mismatch`, `unknown_car`, `unknown_track`. *(Exact strings to be fixed in A3; keep them in sync here.)*

### Live lap stats: `GET /rig/{uuid}/send/live?k={key}&...`

Current lap, for the lounge room's live card. Latest value only, no history.

| Param | Notes |
|---|---|
| `lapNumber` | |
| `lapTotalCount` | optional |
| `laptime_ms` | current lap time so far |
| `deltaBest` | vs best lap |
| `progress` | 0 to 1 |
| `valid` | `true`/`false` |
| `currentSector` | 1–3 |
| `currentSplit` | |
| `s1_ms`, `s2_ms` | optional, once completed |
| `bestS1_ms`, `bestS2_ms`, `bestS3_ms` | optional |

### Sim session stats: `GET /rig/{uuid}/send/session?k={key}&...`

The game's practice/race session (the **sim session**), for the lounge room's session card.

| Param | Example |
|---|---|
| `CurrentGame` | `AssettoCorsaCompetizione` |
| `TrackId` | `brands_hatch` |
| `SessionTypeName` | `PRACTICE`, `HOTLAP`, `RACE`, … |
| `CarId` | `audi_r8_lms_evo` |
| `CarClass` | `GT3` |
| `TCLevel`, `ABSLevel`, `BrakeBias` | `6`, `5`, `-17` |
| `AirTemperature`, `TrackTemperature` | `30`, `37` |
| `rainIntensity`, `rainIntensityIn10min`, `rainIntensityIn30min` | `ACC_NO_RAIN` |

### Stats responses (both endpoints, all `200`)

| Status | Meaning |
|---|---|
| `ok` | Stored on the rig's stats row |
| `ignored` | No active session. Nothing written (a game left open in the menu costs nothing) |
| `rejected` | Invalid params. Nothing written |

Stats never create a session and never refresh `last_activity_at`. Consequence: an anonymous driver's stats are `ignored` until their first lap creates the session.

---

## Part 3: What the overlay does

### Show who's driving (poll)

- Every few seconds while SimHub runs, call the poll and store `rigName`, `sessionActive`, `driverName`.
- Show "Driving: {driverName}" or "No driver".
- A `404` means the config is wrong: show "Rig not recognized" and keep polling slowly (the fix is editing the config, not waiting).
- A network error or `5xx`: keep the last known state, maybe dimmed.

Suggested interval: **5 s**. Every poll is a serverless call plus a database query; 1 s buys nothing a human notices after scanning a QR.

### Show the QR

- Image component pointing at the public bucket URL. Static, fetched once.
- Shown when there's no driver, or whenever the car is not on track (menus, pits). Hidden while driving.

### Send a lap (event driven, with retry)

Triggered by SimHub's **NewValidLap** event.

1. Capture the lap's values *at the event* into variables (the "pending lap"). Don't re-read SimHub later; by then the sector values belong to the next lap.
2. Send `/send/new` with the pending lap.
3. On the response:
   - `200` with a `status`: done. Clear the pending lap. Show feedback for a few seconds ("Lap saved" for `created` and `duplicate`, "Lap not saved" for `rejected`).
   - `404`: done (retrying won't help). Show "Rig not recognized".
   - `5xx`, timeout, no response, or a `200` whose body isn't JSON with a `status`: retry after a delay (e.g. 2 s, 5 s, 10 s), up to a few attempts.
4. A new lap arriving while one is still pending replaces it. Accepted loss: one pending slot, no queue.

Retrying is always safe: the server's duplicate check makes `/send/new` idempotent.

### Send live lap stats

- Every ~1 s, **only while on track**. Fire and forget: no retry, the next one supersedes it.
- Ignore the response, or use `ignored` to stop sending until the poll shows an active session again.

### Send sim session stats

- When car, track, session type or weather changes, plus a slow heartbeat (~30 s). Fire and forget.

---

## Part 4: Maintenance

### Change a rig's key

Do it when nobody's driving: in-flight laps with the old key get `404` and are not retried.

1. `update public.rig_key set api_key = replace(gen_random_uuid()::text, '-', '') where rig_id = '<uuid>' returning api_key;`
2. Paste the new key into the overlay config, restart the dash.
3. Run the Poll and Lap checks from Part 1 step 4.

The UUID, QR, links, lap history and `rig_drivers` are untouched.

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Overlay says "Rig not recognized" | UUID or key typo in config; rig row or `rig_key` row missing |
| Name doesn't appear after connecting | Poll interval; or the connect failed (check the phone) |
| Lap "not saved" | Unmapped car/track (check server logs for the rejected lap); sectors don't add up |
| Lap saved but unclaimed | Nobody was connected, or the session expired (`SESSION_TIMEOUT_MINS`, 120 by default) |
| Lounge stats empty | No active session (stats are `ignored`); or not on track |
| Overlay shows an HTML/garbled response | Vercel deployment protection on a preview URL |

---

## Open issues

Found while writing this. Each is small; each needs an owner.

1. **Sector conversion bug (A3 blocker).** `convertTimeStringToMilliseconds` multiplies a float by 1000 without rounding. About 8% of sector values come out non-integer (e.g. `10861.999…`), fail the `.int()` check and the lap is rejected. Fix: `Math.round`.
2. **Sector sum tolerance.** The check is strict equality. If SimHub ever rounds a sector differently from the lap time, valid laps get `sectors_mismatch`. Decide: strict, or ±1–2 ms tolerance. Worth checking against a few real laps before A3 closes.
4. **Duplicate key is global.** `lap_time_dedupe_uniq` ignores rig and driver. Two people setting the exact same time and sectors on the same car and track (to the millisecond) would collide. Practically impossible; noted so nobody "discovers" it later.
5. **`zSessionStats` is wrong in places.** `rainIntensities` lists `ACC_NO_RAIN` three times, the param is spelled `rainIntesity`, and `SessionTypeName` mixes strings and numbers. `LapStats` has no zod schema yet. Both belong to A4.
6. **Poll cost.** Decide the poll interval before it ships; the overlay runs all day on some rigs.
