# Roadmap

- Google sign-in
- Profile page
  - sync google
  - edit name
  - edit avatar
- Block nameless users, redirect to edit name
- Logout
- Card revamp
  - New style with avatar
  - Track record badge
- Track page
  - Podium revamp with pole rating
  - Graphs:
    - personal progress line chart
    - global laptimes plot chart

# Copilot brief for lounge page building

Context: SvelteKit 5 (runes) + Supabase + shadcn-svelte + Tailwind. Mobile-first web app for sim racing friends/family ("Dá-lhe!").

Task: build the "Lounge room" page UI at src/routes/(authorized)/connect/\[slug\]/lounge. It shows the live state of one shared sim rig.

Data contract (do NOT fetch data in components; receive it via the page `data` prop only):

- rig: rig name
- session: driver? session_stats?, live_lap_stats?, car_name, car_category, track_name, weather?, track_temp?, air_temp?
- live lap: lap_number, lap_total?, laptime, delta_best, laptime_progress, lap_valid, current_sector, current_split, s1_ms?, s2_ms?, best_s1_ms?, best_s2_ms?, best_s3_ms?
- recent laps (from this session): laptime_ms, s1_ms, s2_ms, s3_ms, track_name, car_name, car_category, created_at
- unclaimed laps (from this rig): laptime_ms, s1_ms, s2_ms, s3_ms, track_name, car_name, car_category, created_at

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
- Add a mock data file for the page so it renders without a backend

Existing draft to evaluate: src/routes/(authorized)/connect/\[slug\]/lounge/+page.svelte. Say what to keep and what to replace before changing anything.
