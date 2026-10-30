-- Sprint 1.5, F3: get_lounge_bests returns the app-wide and session bests per
-- track + car category, for the session's laps and the live combination.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed: Carla's active session on Garagem (md5('session-active')) has laps at
-- Brands Hatch (3) and Spa (9), all GT3 (category 1). Records for both tracks
-- come from Bruno's older session (md5('session-records')) and this one.

begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

set local role anon;
select throws_ok(
  $$select * from public.get_lounge_bests(null, 3, 1, false)$$,
  '42501', null, 'anon cannot call get_lounge_bests'
);
reset role;

set local role authenticated;

select results_eq(
  $$select track_id, category_id, record_lap_ms, record_s1_ms, record_s2_ms, record_s3_ms,
           session_lap_ms, session_s1_ms, session_s2_ms, session_s3_ms
    from public.get_lounge_bests(md5('session-active')::uuid, 3, 1, false)$$,
  $$values
    (3::bigint, 1::bigint, 81500, 25280, 29200, 26800, 82100, 25280, 29700, 27120),
    (9::bigint, 1::bigint, 133400, 41354, 48024, 44022, 133400, 41354, 48024, 44022)$$,
  'one row per track + category of the session; sector bests come from any lap'
);

select results_eq(
  $$select track_id, record_lap_ms, session_lap_ms
    from public.get_lounge_bests(md5('session-active')::uuid, 6, 1, false)$$,
  $$values (3::bigint, 81500, 82100), (6::bigint, (select min(time_milliseconds) from public.lap_time
      where track_id = 6 and not for_testing and driver_id is not null), null::integer), (9::bigint, 133400, 133400)$$,
  'the live combination is added even without session laps there (null session bests)'
);

select results_eq(
  $$select track_id, category_id, record_lap_ms, session_lap_ms, session_s1_ms
    from public.get_lounge_bests(null, 3, 1, false)$$,
  $$values (3::bigint, 1::bigint, 81500, null::integer, null::integer)$$,
  'no session: only the live combination, app-wide bests only'
);

select is_empty(
  $$select * from public.get_lounge_bests(null, null, null, false)$$,
  'no session and no live combination: no rows'
);

reset role;

-- An unclaimed lap (no driver) in the session, faster than the record, and a
-- legacy lap without sectors: neither is a record; the session counts both.
insert into public.lap_time (driver_id, track_id, car_id, game_id, rig_id, session_id, time_milliseconds)
values (null, 3, 28, 1, 'b0000000-0000-4000-8000-000000000002', md5('session-active')::uuid, 81000);

-- A test lap (for_testing) faster still, with sectors.
insert into public.lap_time (driver_id, track_id, car_id, game_id, rig_id, session_id,
  time_milliseconds, sector1_ms, sector2_ms, sector3_ms, for_testing)
values ('a0000000-0000-4000-8000-000000000003', 3, 28, 1, 'b0000000-0000-4000-8000-000000000002',
  md5('session-active')::uuid, 80000, 25000, 29000, 26000, true);

set local role authenticated;

select results_eq(
  $$select record_lap_ms, record_s1_ms, session_lap_ms, session_s1_ms
    from public.get_lounge_bests(md5('session-active')::uuid, null, null, false) where track_id = 3$$,
  $$values (81500, 25280, 81000, 25280)$$,
  'unclaimed laps count for the session best, not the record; a lap without sectors keeps the sector bests'
);

select results_eq(
  $$select track_id, record_lap_ms, record_s1_ms, session_lap_ms
    from public.get_lounge_bests(md5('session-active')::uuid, null, null, true)$$,
  $$values (3::bigint, 80000, 25000, 80000)$$,
  'with the test flag, only test laps count (and only their combinations)'
);

select results_eq(
  $$select count(*)::int from public.get_lounge_bests(md5('session-active')::uuid, 3, 1, false)$$,
  $$values (2)$$,
  'the live combination already in the session is not repeated'
);

reset role;

update public.lap_time set dismissed_at = now()
where session_id = md5('session-records')::uuid and track_id = 3;

set local role authenticated;
select results_eq(
  $$select record_lap_ms from public.get_lounge_bests(null, 3, 1, false)$$,
  $$values (82100)$$,
  'dismissed laps never hold a record'
);
reset role;

select * from finish();
rollback;
