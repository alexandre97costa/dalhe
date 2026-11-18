-- Homepage Activity feed: paginated recent laps, with "View session" for live ones.

-- listing_recent_laptimes -------------------------------------------------------
-- Same view, three columns appended (create or replace only allows appending):
--   lap_id            tiebreaker for the (created_at, lap_id) pagination cursor
--   session_id        to ask whether the lap's session is still active
--   driver_avatar_url the row's avatar
-- The window columns stay computed over all laps, so later pages stay correct.

create or replace view public.listing_recent_laptimes with (security_invoker = on) as
 select l.created_at,
    l.game_id,
    driver.id as driverid,
    driver.username as driver,
    car_make.name as car_make,
    car.model as car_model,
    track.id as trackid,
    track.name as track_name,
    l.time_milliseconds as laptime,
    lag(l.time_milliseconds) over (partition by l.driver_id, l.track_id order by l.created_at) as previous_laptime,
    (l.time_milliseconds = min(l.time_milliseconds) over (partition by l.track_id, l.driver_id)) as is_personal_best,
    (l.time_milliseconds = min(l.time_milliseconds) over (partition by l.track_id)) as is_track_record,
    l.id as lap_id,
    l.session_id,
    driver.avatar_url as driver_avatar_url
   from public.lap_time l
     join public.profiles driver on driver.id = l.driver_id
     join public.car on car.id = l.car_id
     join public.car_make on car_make.id = car.make_id
     join public.race_track track on track.id = l.track_id
  where l.for_testing = false
  order by l.created_at desc;

-- active_lap_sessions -----------------------------------------------------------
-- Of the given sessions, the ones that are currently THE active session of their
-- rig, with that rig. The expiry rule is rig_active_session's (one rule), with
-- the app's SESSION_TIMEOUT_MINS passed in. Null and unknown ids drop out.
-- Read-only. Security definer so it can call rig_active_session.

create function public.active_lap_sessions(p_session_ids uuid[], p_expiry_minutes integer)
returns table (session_id uuid, rig_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, r.rig_id
  from (
    select distinct s.rig_id
    from public.rig_session s
    where s.id = any(p_session_ids)
  ) r
  cross join lateral public.rig_active_session(r.rig_id, p_expiry_minutes) a
  where a.id = any(p_session_ids);
$$;

revoke execute on function public.active_lap_sessions(uuid[], integer) from public, anon, authenticated, service_role;
grant execute on function public.active_lap_sessions(uuid[], integer) to authenticated;
