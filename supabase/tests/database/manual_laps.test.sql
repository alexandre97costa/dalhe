-- Manual laps: the app_settings switch and insert_manual_lap.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed user: alice (a…01). Lap times are unusual values (33:33.333 and up) so they
-- never collide with seed laps on the duplicate key.

begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

create temp table t_ids as
select (select min(id) from public.race_track)::integer as track_id,
       (select min(id) from public.car)::integer as car_id,
       (select min(id) from public.game)::integer as game_id;
grant select on t_ids to authenticated, anon;

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

-- Switch off (the migration's default)
select is(
  (select status from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2013333, null, null, null, false)),
  'disabled',
  'the switch starts off and refuses manual laps'
);

select is(
  (select manual_laps_enabled from public.app_settings),
  false,
  'a logged-in user can read the switch'
);

select throws_ok(
  $$update public.app_settings set manual_laps_enabled = true$$,
  '42501',
  null,
  'a logged-in user cannot flip the switch'
);

-- Switch on, as the admin would in the SQL editor
reset role;
update public.app_settings set manual_laps_enabled = true;
set local role authenticated;

select is(
  (select status from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2013333, null, null, null, false)),
  'created',
  'with the switch on, a lap without sectors is created'
);

select results_eq(
  $$select driver_id, rig_id, session_id, game_id::integer, sector1_ms
    from public.lap_time where time_milliseconds = 2013333$$,
  $$select 'a0000000-0000-4000-8000-000000000001'::uuid, null::uuid, null::uuid,
           (select game_id from t_ids), null::integer$$,
  'the lap belongs to the logged-in user and has no rig or session'
);

select is(
  (select status from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2013333, null, null, null, false)),
  'duplicate',
  'the same lap again is a duplicate'
);

select is(
  (select count(*)::integer from public.lap_time where time_milliseconds = 2013333),
  1,
  'a duplicate writes nothing'
);

select is(
  (select status from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2014444, 600000, 700000, 700000, false)),
  'sectors_mismatch',
  'sectors that do not add up are refused'
);

select is(
  (select status from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2014444, 1000000, 1014444, null, false)),
  'sectors_mismatch',
  'two sectors out of three are refused'
);

select is(
  (select status from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2014444, 600000, 700000, 714444, false)),
  'created',
  'three sectors that add up are stored'
);

select results_eq(
  $$select sector1_ms, sector2_ms, sector3_ms from public.lap_time where time_milliseconds = 2014444$$,
  $$values (600000, 700000, 714444)$$,
  'the sectors are stored as given'
);

select throws_ok(
  $$select * from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    0, null, null, null, false)$$,
  '22023',
  null,
  'a lap time of zero is refused'
);

-- Logged in, but no user id in the token
select set_config('request.jwt.claims', '{"role": "authenticated"}', true);
select throws_ok(
  $$select * from public.insert_manual_lap(
    (select game_id from t_ids), (select track_id from t_ids), (select car_id from t_ids),
    2015555, null, null, null, false)$$,
  '42501',
  null,
  'without a user id there is no driver, so nothing is stored'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.insert_manual_lap(1, 1, 1, 2015555, null, null, null, false)$$,
  '42501',
  null,
  'anon cannot call insert_manual_lap'
);

select * from finish();
rollback;
