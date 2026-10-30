-- Sprint 1, A0: rig data and laps are writable only through the paths meant for them.
-- Rig tables: rig endpoints (service role) or user rpcs that take the user from auth.uid().
-- Laps: rig endpoints, or manual entry of the user's own laps.

-- connect_to_rig ------------------------------------------------------------
-- New arguments: the driver comes from auth.uid(), and the caller passes the
-- driver it was shown, so a takeover is always deliberate.

drop function public.connect_to_rig(uuid, uuid);

create function public.connect_to_rig(
  p_rig_id uuid,
  p_expected_driver_id uuid,
  p_timeout_minutes integer
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_driver_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- serialize concurrent connects and disconnects on the same rig
  perform 1 from public.rig where id = p_rig_id for update;
  if not found then
    raise exception 'rig not found' using errcode = 'P0002';
  end if;

  -- close a stale session first (same rule as rig_status), so the page and
  -- this rpc agree on who is driving
  update public.rig_session
  set ended_at = last_activity_at
  where rig_id = p_rig_id
    and ended_at is null
    and last_activity_at <= now() - make_interval(mins => p_timeout_minutes);

  select driver_id into v_current_driver_id
  from public.rig_session
  where rig_id = p_rig_id and ended_at is null;

  -- someone connected after the page loaded: let the user decide again
  if v_current_driver_id is distinct from p_expected_driver_id then
    return 'driver_changed';
  end if;

  -- already the driver (e.g. a resubmitted form): keep the session and its laps
  if v_current_driver_id = v_user_id then
    return 'connected';
  end if;

  -- close whatever is open (anonymous or another driver); its laps stay where they are
  update public.rig_session
  set ended_at = now()
  where rig_id = p_rig_id and ended_at is null;

  insert into public.rig_session (rig_id, driver_id, started_at, last_activity_at)
  values (p_rig_id, v_user_id, now(), now());

  -- remember this rig for the user
  insert into public.rig_drivers (rig_id, driver_id, last_connected_at)
  values (p_rig_id, v_user_id, now())
  on conflict (rig_id, driver_id)
  do update set last_connected_at = excluded.last_connected_at;

  -- don't show the previous driver's stats to the new one
  delete from public.rig_stats where id = p_rig_id;

  return 'connected';
end;
$$;

revoke execute on function public.connect_to_rig(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.connect_to_rig(uuid, uuid, integer) to authenticated;

-- disconnect_from_rig -------------------------------------------------------
-- Only the session's driver can close it. Anyone else, or no active session:
-- quiet no-op (returns null).

drop function public.disconnect_from_rig(uuid);

create function public.disconnect_from_rig(
  p_rig_id uuid,
  p_timeout_minutes integer
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- same lock as connect_to_rig, so the two can't interleave
  perform 1 from public.rig where id = p_rig_id for update;
  if not found then
    return null;
  end if;

  update public.rig_session
  set ended_at = last_activity_at
  where rig_id = p_rig_id
    and ended_at is null
    and last_activity_at <= now() - make_interval(mins => p_timeout_minutes);

  update public.rig_session
  set ended_at = now()
  where rig_id = p_rig_id
    and ended_at is null
    and driver_id = v_user_id
  returning id into v_session_id;

  if v_session_id is not null then
    delete from public.rig_stats where id = p_rig_id;
  end if;

  return v_session_id;
end;
$$;

revoke execute on function public.disconnect_from_rig(uuid, integer) from public, anon, authenticated;
grant execute on function public.disconnect_from_rig(uuid, integer) to authenticated;

-- Rig-only rpcs: service role only --------------------------------------------

revoke execute on function public.insert_lap(uuid, integer, boolean, integer, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.get_or_create_active_session(uuid, integer) from public, anon, authenticated;

-- rig_status: read-only; connect and lounge pages (authenticated), rig endpoints (service role)

revoke execute on function public.rig_status(uuid, integer) from public, anon, authenticated;
grant execute on function public.rig_status(uuid, integer) to authenticated;

-- Policies: no client writes to rig tables ------------------------------------

drop policy "Enable insert for authenticated users only" on public.rig_session;
drop policy "Enable update for all users " on public.rig_session;
drop policy "Anyone can update stats" on public.rig_stats;
drop policy "Enable delete for auth users" on public.rig_stats;
drop policy "Auth users can create their own" on public.rig_drivers;
drop policy "Auth users can update their own" on public.rig_drivers;

-- Laps: no client updates. The policy and the column grant existed only because
-- update_pole_rating ran as the inserting user; it now runs as its owner.

drop policy "user can update other laps (pole_rating)" on public.lap_time;
revoke update (pole_rating) on public.lap_time from authenticated;

create or replace function public.update_pole_rating() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lap record;
begin
  select l.*
  into lap
  from public.lap_time l
  where l.track_id = new.track_id
  order by l.time_milliseconds asc
  limit 1;

  raise log '[Update pole rating] TR Before: %', lap.pole_rating;

  if lap.driver_id <> new.driver_id and lap.id is not null then
    update public.lap_time
    set pole_rating = lap.pole_rating + 1
    where public.lap_time.id = lap.id;

    raise log '[Update pole rating] TR After: %', lap.pole_rating + 1;
  end if;

  return new;
end;
$$;
