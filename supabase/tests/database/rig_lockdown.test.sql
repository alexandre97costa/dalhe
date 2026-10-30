-- Sprint 1, A0: rig tables and laps are writable only through the paths meant for them.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed: rig "Sala" (b…01) is free; rig "Garagem" (b…02) has an active session
-- driven by Carla (a…03). Alice is a…01, Bruno a…02.

begin;
create extension if not exists pgtap with schema extensions;

select plan(33);

-- Fixtures (as postgres) ----------------------------------------------------

-- The seed's active session is only recent right after a reset
update public.rig_session set last_activity_at = now() where id = md5('session-active')::uuid;

insert into public.rig_stats (id, session_stats) values
  ('b0000000-0000-4000-8000-000000000002', '{"seed": true}')
on conflict (id) do update set session_stats = excluded.session_stats;

-- A lap Alice doesn't hold: the fastest lap on a track where the record is someone else's
create temporary table record_lap as
select distinct on (track_id) id, track_id, car_id, time_milliseconds, driver_id, pole_rating
from public.lap_time
order by track_id, time_milliseconds;
delete from record_lap where driver_id = 'a0000000-0000-4000-8000-000000000001';
delete from record_lap where id <> (select min(id) from record_lap);
grant select on record_lap to authenticated;

-- anon ----------------------------------------------------------------------

set local role anon;

select throws_ok(
  $$insert into public.rig_session (rig_id) values ('b0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'anon cannot insert into rig_session'
);

update public.rig_session set driver_id = 'a0000000-0000-4000-8000-000000000001'
where id = md5('session-active')::uuid;
select is(
  (select driver_id from public.rig_session where id = md5('session-active')::uuid),
  'a0000000-0000-4000-8000-000000000003'::uuid,
  'anon cannot reassign a session''s driver'
);

select throws_ok(
  $$insert into public.rig_stats (id) values ('b0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'anon cannot insert into rig_stats'
);

update public.rig_stats set session_stats = '{"hacked": true}'
where id = 'b0000000-0000-4000-8000-000000000002';
delete from public.rig_stats where id = 'b0000000-0000-4000-8000-000000000002';
select is(
  (select session_stats::text from public.rig_stats where id = 'b0000000-0000-4000-8000-000000000002'),
  '{"seed": true}',
  'anon cannot update or delete rig_stats'
);

select throws_ok(
  $$insert into public.rig_drivers (rig_id, driver_id)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'anon cannot insert into rig_drivers'
);

select throws_ok(
  $$select public.insert_lap('b0000000-0000-4000-8000-000000000001', 30, false, 1, 1, 90000, 30000, 30000, 30000)$$,
  '42501', null, 'anon cannot call insert_lap'
);

select throws_ok(
  $$select public.get_or_create_active_session('b0000000-0000-4000-8000-000000000001', 30)$$,
  '42501', null, 'anon cannot call get_or_create_active_session'
);

select throws_ok(
  $$select public.connect_to_rig('b0000000-0000-4000-8000-000000000001', null, 30)$$,
  '42501', null, 'anon cannot call connect_to_rig'
);

select throws_ok(
  $$select public.disconnect_from_rig('b0000000-0000-4000-8000-000000000002', 30)$$,
  '42501', null, 'anon cannot call disconnect_from_rig'
);

select throws_ok(
  $$select * from public.rig_status('b0000000-0000-4000-8000-000000000001', 30)$$,
  '42501', null, 'anon cannot call rig_status'
);

-- authenticated: Alice --------------------------------------------------------

reset role;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$insert into public.rig_session (rig_id, driver_id)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'a user cannot insert into rig_session'
);

update public.rig_session set driver_id = 'a0000000-0000-4000-8000-000000000001'
where id = md5('session-active')::uuid;
select is(
  (select driver_id from public.rig_session where id = md5('session-active')::uuid),
  'a0000000-0000-4000-8000-000000000003'::uuid,
  'a user cannot reassign a session''s driver'
);

update public.rig_drivers set driver_id = 'a0000000-0000-4000-8000-000000000001'
where driver_id = 'a0000000-0000-4000-8000-000000000002';
select is(
  (select count(*)::int from public.rig_drivers where driver_id = 'a0000000-0000-4000-8000-000000000002'),
  1,
  'a user cannot rewrite someone else''s rig_drivers row'
);

delete from public.rig_stats where id = 'b0000000-0000-4000-8000-000000000002';
select is(
  (select count(*)::int from public.rig_stats where id = 'b0000000-0000-4000-8000-000000000002'),
  1,
  'a user cannot delete rig_stats'
);

select throws_ok(
  $$update public.lap_time set time_milliseconds = 1 where id = (select id from record_lap)$$,
  '42501', null, 'a user cannot change a lap time'
);

select throws_ok(
  $$update public.lap_time set pole_rating = 99 where id = (select id from record_lap)$$,
  '42501', null, 'a user cannot change a pole rating'
);

select throws_ok(
  $$select public.insert_lap('b0000000-0000-4000-8000-000000000001', 30, false, 1, 1, 90000, 30000, 30000, 30000)$$,
  '42501', null, 'a user cannot call insert_lap'
);

select throws_ok(
  $$select public.get_or_create_active_session('b0000000-0000-4000-8000-000000000001', 30)$$,
  '42501', null, 'a user cannot call get_or_create_active_session'
);

select is(
  (select driver_id from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  'a0000000-0000-4000-8000-000000000003'::uuid,
  'a user can read rig_status'
);

-- connect_to_rig

select is(
  public.connect_to_rig('b0000000-0000-4000-8000-000000000002', null, 30),
  'driver_changed',
  'connect refuses when the shown driver is not the current one'
);

select is(
  public.connect_to_rig('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 30),
  'connected',
  'connect takes over when the shown driver is the current one'
);

select is(
  (select driver_id from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'connect makes the caller the driver'
);

select is(
  (select ended_at is not null from public.rig_session where id = md5('session-active')::uuid),
  true,
  'connect closes the previous driver''s session'
);

select is(
  (select count(*)::int from public.rig_stats where id = 'b0000000-0000-4000-8000-000000000002'),
  0,
  'connect clears the rig''s stats'
);

select is(
  public.connect_to_rig('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 30),
  'connected',
  'connect again as the driver'
);

-- Alice has no seed sessions on Garagem, so a reopened session would make two
select is(
  (select count(*)::int from public.rig_session
   where rig_id = 'b0000000-0000-4000-8000-000000000002' and driver_id = 'a0000000-0000-4000-8000-000000000001'),
  1,
  'connect again as the driver keeps the session'
);

select is(
  public.connect_to_rig('b0000000-0000-4000-8000-000000000001', null, 30),
  'connected',
  'connect to a free rig'
);

-- disconnect_from_rig: Bruno can't close Alice's session

reset role;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
set local role authenticated;

select is(
  public.disconnect_from_rig('b0000000-0000-4000-8000-000000000002', 30),
  null,
  'disconnect by a non-driver is a no-op'
);

select is(
  (select driver_id from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'the driver stays connected after a non-driver disconnects'
);

reset role;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select isnt(
  public.disconnect_from_rig('b0000000-0000-4000-8000-000000000002', 30),
  null,
  'the driver can disconnect'
);

select is(
  (select session_active from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  false,
  'the rig is free after disconnect'
);

-- Manual entry still works and still updates pole ratings

insert into public.lap_time (track_id, car_id, time_milliseconds)
select track_id, car_id, time_milliseconds + 12345 from record_lap;
select is(
  (select pole_rating from public.lap_time where id = (select id from record_lap)),
  (select pole_rating + 1 from record_lap)::smallint,
  'manual entry updates the record holder''s pole rating'
);

select throws_ok(
  $$insert into public.lap_time (track_id, car_id, time_milliseconds, driver_id)
    select track_id, car_id, time_milliseconds + 23456, 'a0000000-0000-4000-8000-000000000002' from record_lap$$,
  '42501', null, 'manual entry cannot add a lap in someone else''s name'
);

select * from finish();
rollback;
