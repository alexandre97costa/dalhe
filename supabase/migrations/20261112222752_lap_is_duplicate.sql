-- Rig debug tools: the lap dry run on /send/new runs the same duplicate check as a
-- real lap without writing. The check moves out of insert_lap into a read-only
-- function that both paths call, so the rule lives in one place.
-- insert_lap keeps its signature (create or replace keeps its grants).

-- 1. Is this lap already stored? Same key as lap_time_dedupe_uniq. A sector of 0
-- means "no sector" (stored as null), as in insert_lap.
create function public.lap_is_duplicate(
  p_track_id integer,
  p_car_id integer,
  p_lap_time_ms integer,
  p_s1_ms integer,
  p_s2_ms integer,
  p_s3_ms integer
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lap_time l
    where l.track_id = p_track_id
      and l.car_id = p_car_id
      and l.time_milliseconds = p_lap_time_ms
      and l.sector1_ms is not distinct from nullif(p_s1_ms, 0)
      and l.sector2_ms is not distinct from nullif(p_s2_ms, 0)
      and l.sector3_ms is not distinct from nullif(p_s3_ms, 0)
  );
$$;

-- Rig endpoints only
revoke execute on function public.lap_is_duplicate(integer, integer, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.lap_is_duplicate(integer, integer, integer, integer, integer, integer) to service_role;

-- 2. insert_lap: unchanged except that step 1 calls lap_is_duplicate.
create or replace function public.insert_lap(
  p_rig_id uuid,
  p_timeout_minutes integer,
  p_for_testing boolean,
  p_track_id integer,
  p_car_id integer,
  p_lap_time_ms integer,
  p_s1_ms integer,
  p_s2_ms integer,
  p_s3_ms integer
) returns table (lap_id bigint, status text)
language plpgsql
-- no `set search_path = ''`: get_or_create_active_session uses unqualified names
-- and would inherit it
as $$
declare
  v_s1 integer := nullif(p_s1_ms, 0);
  v_s2 integer := nullif(p_s2_ms, 0);
  v_s3 integer := nullif(p_s3_ms, 0);
  v_session_id uuid;
  v_driver_id uuid;
  v_lap_id bigint;
begin
  -- 1. same lap already stored: answer before touching sessions
  if public.lap_is_duplicate(p_track_id, p_car_id, p_lap_time_ms, p_s1_ms, p_s2_ms, p_s3_ms) then
    return query select null::bigint, 'duplicate';
    return;
  end if;

  -- 2. the rig's active session, or a new anonymous one
  v_session_id := public.get_or_create_active_session(p_rig_id, p_timeout_minutes);

  select s.driver_id into v_driver_id
  from public.rig_session s
  where s.id = v_session_id;

  insert into public.lap_time (
    rig_id, session_id, driver_id, track_id, car_id,
    time_milliseconds, sector1_ms, sector2_ms, sector3_ms,
    for_testing
  )
  values (
    p_rig_id, v_session_id, v_driver_id, p_track_id, p_car_id,
    p_lap_time_ms, v_s1, v_s2, v_s3,
    p_for_testing
  )
  on conflict (track_id, car_id, time_milliseconds, sector1_ms, sector2_ms, sector3_ms) do nothing
  returning id into v_lap_id;

  -- 3. an identical lap won a race with this one between step 1 and the insert
  if v_lap_id is null then
    return query select null::bigint, 'duplicate';
    return;
  end if;

  update public.rig_session
  set last_activity_at = now()
  where id = v_session_id;

  return query select v_lap_id, 'created';
end;
$$;
