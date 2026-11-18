-- Homepage Activity: active_lap_sessions says which laps' sessions are still live.
-- Runs against the seed (pnpm exec supabase test db).
--
-- Seed: Garagem (b…02) has an active session (md5('session-active'), Carla);
-- Cave (b…04) has a session open but idle for 3 hours (md5('session-expired'));
-- md5('session-1-1') is an ended session on Sala (b…01).

begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

-- The seed's active session is only recent right after a reset
update public.rig_session set last_activity_at = now() where id = md5('session-active')::uuid;

-- Superseded: an earlier session on Garagem (seed driver 3 runs there). One open
-- session per rig is a constraint, so a superseded session is closed, and the rig
-- now has a newer active one.

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select results_eq(
  $$select session_id, rig_id from public.active_lap_sessions(array[md5('session-active')::uuid], 120)$$,
  $$values (md5('session-active')::uuid, 'b0000000-0000-4000-8000-000000000002'::uuid)$$,
  'an active session is returned with its rig'
);

select is_empty(
  $$select * from public.active_lap_sessions(array[md5('session-1-1')::uuid], 120)$$,
  'an ended session is not returned'
);

select is_empty(
  $$select * from public.active_lap_sessions(array[md5('session-expired')::uuid], 120)$$,
  'an expired session (old last_activity_at) is not returned'
);

select is_empty(
  $$select * from public.active_lap_sessions(array[md5('session-3-6')::uuid], 120)$$,
  'a superseded session on the same rig is not returned'
);

select results_eq(
  $$select session_id from public.active_lap_sessions(
      array[null, gen_random_uuid(), md5('session-active')::uuid, md5('session-3-6')::uuid, md5('session-1-1')::uuid],
      120)$$,
  $$values (md5('session-active')::uuid)$$,
  'null and unknown ids are ignored, a mixed list returns only the active one'
);

select is_empty(
  $$select * from public.active_lap_sessions(array[]::uuid[], 120)$$,
  'an empty list returns nothing'
);

select is_empty(
  $$select * from public.active_lap_sessions(null, 120)$$,
  'a null list returns nothing'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.active_lap_sessions(array[md5('session-active')::uuid], 120)$$,
  '42501', null, 'anon cannot call active_lap_sessions'
);

select * from finish();
rollback;
