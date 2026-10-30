-- Sprint 1, A2: rig_status (behind the poll) reports expired sessions as inactive
-- without writing anything. Runs against the seed (pnpm exec supabase test db).
--
-- Seed: rig "Sala" (b…01) is free; rig "Garagem" (b…02) has an active session
-- driven by Carla (a…03).

begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

-- The seed's active session is only recent right after a reset
update public.rig_session set last_activity_at = now() where id = md5('session-active')::uuid;

select is(
  (select session_active from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  true,
  'a recent session is active'
);

select is(
  (select driver_name from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  'carla',
  'the driver name is the username'
);

select results_eq(
  $$select session_active, driver_name from public.rig_status('b0000000-0000-4000-8000-000000000001', 30)$$,
  $$values (false, null::text)$$,
  'a free rig is inactive with no driver'
);

-- Expired: last activity older than the timeout
update public.rig_session
set last_activity_at = now() - interval '31 minutes'
where id = md5('session-active')::uuid;

select is(
  (select session_active from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  false,
  'an expired session is inactive'
);

select is(
  (select driver_id from public.rig_status('b0000000-0000-4000-8000-000000000002', 30)),
  null,
  'an expired session has no driver'
);

select is(
  (select ended_at from public.rig_session where id = md5('session-active')::uuid),
  null,
  'rig_status writes nothing: the expired session is still open in the table'
);

-- Anonymous: laps arrived, nobody connected
insert into public.rig_session (rig_id, driver_id)
values ('b0000000-0000-4000-8000-000000000001', null);

select results_eq(
  $$select session_active, driver_name from public.rig_status('b0000000-0000-4000-8000-000000000001', 30)$$,
  $$values (true, null::text)$$,
  'an anonymous session is active with no driver'
);

select * from finish();
rollback;
