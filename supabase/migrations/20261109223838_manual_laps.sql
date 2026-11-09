-- Manual laps as a fallback for when the SimHub overlay can't send laps.
-- Off by default. Turn it on (or off) with one update in the SQL editor:
--   update public.app_settings set manual_laps_enabled = true;
-- The lap_time table stays locked (lock_down_manual_laps): manual laps only go in
-- through insert_manual_lap, which takes the driver from the login.

-- 1. App-wide settings: exactly one row (id is always true).
create table public.app_settings (
  id boolean primary key default true check (id),
  manual_laps_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is 'App-wide switches, one row. Changed by hand in the SQL editor, never through the API.';
comment on column public.app_settings.manual_laps_enabled is 'Shows the "Add lap" link and lets insert_manual_lap store laps.';

insert into public.app_settings default values;

alter table public.app_settings enable row level security;

revoke all on table public.app_settings from anon, authenticated;
grant select on table public.app_settings to authenticated;

create policy "Logged-in users can read the settings"
  on public.app_settings for select
  to authenticated
  using (true);

-- 2. A lap typed in by the logged-in driver. No rig and no session: that is how
-- manual laps are told apart from rig laps.
-- Sectors are all three or none, and must add up to the lap time.
-- Same duplicate key as insert_lap (lap_time_dedupe_uniq). Sectors and the test flag can be left out.
create function public.insert_manual_lap(
  p_game_id integer,
  p_track_id integer,
  p_car_id integer,
  p_lap_time_ms integer,
  p_s1_ms integer default null,
  p_s2_ms integer default null,
  p_s3_ms integer default null,
  p_for_testing boolean default false
) returns table (lap_id bigint, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver_id uuid := auth.uid();
  v_sector_count integer := num_nonnulls(p_s1_ms, p_s2_ms, p_s3_ms);
  v_lap_id bigint;
begin
  if v_driver_id is null then
    raise exception 'insert_manual_lap needs a logged-in user' using errcode = '42501';
  end if;

  if not coalesce((select s.manual_laps_enabled from public.app_settings s), false) then
    return query select null::bigint, 'disabled';
    return;
  end if;

  if p_lap_time_ms is null or p_lap_time_ms <= 0 then
    raise exception 'lap time must be positive' using errcode = '22023';
  end if;

  if v_sector_count not in (0, 3)
    or (v_sector_count = 3 and (
      least(p_s1_ms, p_s2_ms, p_s3_ms) <= 0
      or p_s1_ms + p_s2_ms + p_s3_ms <> p_lap_time_ms
    ))
  then
    return query select null::bigint, 'sectors_mismatch';
    return;
  end if;

  insert into public.lap_time (
    driver_id, game_id, track_id, car_id,
    time_milliseconds, sector1_ms, sector2_ms, sector3_ms,
    for_testing
  )
  values (
    v_driver_id, p_game_id, p_track_id, p_car_id,
    p_lap_time_ms, p_s1_ms, p_s2_ms, p_s3_ms,
    coalesce(p_for_testing, false)
  )
  on conflict (track_id, car_id, time_milliseconds, sector1_ms, sector2_ms, sector3_ms) do nothing
  returning id into v_lap_id;

  if v_lap_id is null then
    return query select null::bigint, 'duplicate';
    return;
  end if;

  return query select v_lap_id, 'created';
end;
$$;

revoke execute on function public.insert_manual_lap(integer, integer, integer, integer, integer, integer, integer, boolean) from public, anon;
grant execute on function public.insert_manual_lap(integer, integer, integer, integer, integer, integer, integer, boolean) to authenticated;
