-- Sprint 1, A3: insert_lap answers created / duplicate, and a duplicate writes nothing.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed: rig "Sala" (b…01); rig "Garagem" (b…02) with Carla's (a…03) active session.

begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

-- Fixtures: Garagem's session recent, Sala free
update public.rig_session set last_activity_at = now() - interval '5 minutes'
where id = md5('session-active')::uuid;
update public.rig_session set ended_at = now()
where rig_id = 'b0000000-0000-4000-8000-000000000001' and ended_at is null;

set local role service_role;

-- created ---------------------------------------------------------------------

create temporary table first_lap as
select * from public.insert_lap('b0000000-0000-4000-8000-000000000002', 30, false, 3, 28, 91234, 30000, 31000, 30234);

select is((select status from first_lap), 'created', 'a new lap is created');
select isnt((select lap_id from first_lap), null, 'a created lap returns its id');

select results_eq(
  $$select session_id, driver_id from public.lap_time where id = (select lap_id from first_lap)$$,
  $$values (md5('session-active')::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid)$$,
  'the lap lands in the active session, under its driver'
);

select ok(
  (select last_activity_at > now() - interval '1 minute' from public.rig_session where id = md5('session-active')::uuid),
  'a created lap refreshes the session''s last activity'
);

-- duplicate -------------------------------------------------------------------

update public.rig_session set last_activity_at = now() - interval '5 minutes'
where id = md5('session-active')::uuid;

select results_eq(
  $$select lap_id, status from public.insert_lap('b0000000-0000-4000-8000-000000000002', 30, false, 3, 28, 91234, 30000, 31000, 30234)$$,
  $$values (null::bigint, 'duplicate'::text)$$,
  'the same lap again is a duplicate, without an id'
);

select is(
  (select count(*)::int from public.lap_time where track_id = 3 and car_id = 28 and time_milliseconds = 91234),
  1,
  'a duplicate adds no row'
);

select ok(
  (select last_activity_at < now() - interval '4 minutes' from public.rig_session where id = md5('session-active')::uuid),
  'a duplicate leaves last activity alone'
);

select is(
  (select status from public.insert_lap('b0000000-0000-4000-8000-000000000001', 30, false, 3, 28, 91234, 30000, 31000, 30234)),
  'duplicate',
  'the same lap from a rig without a session is a duplicate too'
);

select is(
  (select count(*)::int from public.rig_session where rig_id = 'b0000000-0000-4000-8000-000000000001' and ended_at is null),
  0,
  'a duplicate creates no session'
);

-- created on a free rig ---------------------------------------------------------

select is(
  (select status from public.insert_lap('b0000000-0000-4000-8000-000000000001', 30, false, 3, 28, 92345, 30000, 31000, 31345)),
  'created',
  'a lap on a free rig is created'
);

select results_eq(
  $$select l.driver_id, s.driver_id, s.ended_at
    from public.lap_time l join public.rig_session s on s.id = l.session_id
    where l.time_milliseconds = 92345 and l.track_id = 3$$,
  $$values (null::uuid, null::uuid, null::timestamptz)$$,
  'it opens an anonymous session and the lap is unclaimed'
);

select * from finish();
rollback;
