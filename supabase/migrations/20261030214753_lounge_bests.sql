-- Sprint 1.5, F3: the bests the lounge compares every lap and sector with.
--
-- One row per track + car category: every combination present in the
-- session's laps, plus the live one (p_track_id + p_category_id) when given.
-- Each row has the app-wide bests (record_*) and the session's bests
-- (session_*): lap, S1, S2, S3. A best is null when there is nothing to
-- compare with (no laps, or no laps with that sector).
--
-- - App-wide bests follow the leaderboards: laps with a driver (unclaimed laps
--   don't hold records), not dismissed, same test flag.
-- - Session bests: every lap of the session with the same test flag (the same
--   laps the lounge lists).
-- - min() skips nulls: sector bests come from laps with sectors, lap bests
--   count every lap (legacy laps without sectors included).
-- - p_session_id null (no active session): only the live combination, with
--   null session bests.
--
-- Read-only, security invoker: lap_time and car are readable by everyone.

create function public.get_lounge_bests(
  p_session_id uuid,
  p_track_id bigint,
  p_category_id bigint,
  p_testing boolean
) returns table (
  track_id bigint,
  category_id bigint,
  record_lap_ms integer,
  record_s1_ms integer,
  record_s2_ms integer,
  record_s3_ms integer,
  session_lap_ms integer,
  session_s1_ms integer,
  session_s2_ms integer,
  session_s3_ms integer
)
language sql
stable
set search_path = ''
as $$
  with combos as (
    select l.track_id, c.category_id
    from public.lap_time l
    join public.car c on c.id = l.car_id
    where p_session_id is not null
      and l.session_id = p_session_id
      and l.for_testing = p_testing
    union
    select p_track_id, p_category_id
    where p_track_id is not null and p_category_id is not null
  )
  select
    k.track_id,
    k.category_id,
    r.lap_ms, r.s1_ms, r.s2_ms, r.s3_ms,
    s.lap_ms, s.s1_ms, s.s2_ms, s.s3_ms
  from combos k
  cross join lateral (
    select
      min(l.time_milliseconds) as lap_ms,
      min(l.sector1_ms) as s1_ms,
      min(l.sector2_ms) as s2_ms,
      min(l.sector3_ms) as s3_ms
    from public.lap_time l
    join public.car c on c.id = l.car_id
    where l.track_id = k.track_id
      and c.category_id = k.category_id
      and l.for_testing = p_testing
      and l.driver_id is not null
      and l.dismissed_at is null
  ) r
  cross join lateral (
    select
      min(l.time_milliseconds) as lap_ms,
      min(l.sector1_ms) as s1_ms,
      min(l.sector2_ms) as s2_ms,
      min(l.sector3_ms) as s3_ms
    from public.lap_time l
    join public.car c on c.id = l.car_id
    where l.session_id = p_session_id
      and l.track_id = k.track_id
      and c.category_id = k.category_id
      and l.for_testing = p_testing
  ) s
  order by k.track_id, k.category_id;
$$;

-- Logged-in users only (the lounge load)
revoke execute on function public.get_lounge_bests(uuid, bigint, bigint, boolean) from public, anon;
grant execute on function public.get_lounge_bests(uuid, bigint, bigint, boolean) to authenticated;
