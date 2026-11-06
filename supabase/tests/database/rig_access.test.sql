-- Sprint 2, D1–D3: spectate_rig, get_my_rigs and user_tip.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed: Sala (b…01) free; Garagem (b…02) Carla (a…03) driving; Escritório
-- (b…03) anonymous session; Cave (b…04) open session idle for 3 hours
-- (expired at 120 minutes). Alice (a…01) has all four rigs, Bruno (a…02)
-- Garagem spectate-only, Carla Garagem connected, Diogo (a…04) none.

begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- Fixtures (as postgres) ------------------------------------------------------

-- The seed's live sessions are only recent right after a reset
update public.rig_session set last_activity_at = now()
where id in (md5('session-active')::uuid, md5('session-anonymous')::uuid);

insert into public.rig_stats (id, session_stats, lap_stats) values
  ('b0000000-0000-4000-8000-000000000002', '{"seed": true}', '{"seed": true}')
on conflict (id) do update set session_stats = excluded.session_stats, lap_stats = excluded.lap_stats;

-- Everything spectating must not touch, as it is now
create temporary table before_sessions as select * from public.rig_session;
create temporary table before_stats as select * from public.rig_stats;
create temporary table before_drivers as select * from public.rig_drivers;

-- anon ------------------------------------------------------------------------

set local role anon;

select throws_ok(
  $$select public.spectate_rig('b0000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'anon cannot call spectate_rig'
);

select throws_ok(
  $$select * from public.get_my_rigs(120)$$,
  '42501', null, 'anon cannot call get_my_rigs'
);

select throws_ok(
  $$select * from public.user_tip$$,
  '42501', null, 'anon cannot read user_tip'
);

reset role;

-- The expiry helper is internal ------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000004", "role": "authenticated"}', true);

select throws_ok(
  $$select * from public.rig_active_session('b0000000-0000-4000-8000-000000000002', 120)$$,
  '42501', null, 'authenticated cannot call rig_active_session directly'
);

-- Spectate: Diogo, no rigs yet --------------------------------------------------

select is_empty(
  $$select * from public.get_my_rigs(120)$$,
  'a user without associations has no rigs'
);

select is(
  public.spectate_rig('b0000000-0000-4000-8000-000000000002'),
  'ok',
  'spectate_rig returns ok'
);

reset role;

select results_eq(
  $$select last_connected_at, last_viewed_at = now() from public.rig_drivers
    where rig_id = 'b0000000-0000-4000-8000-000000000002' and driver_id = 'a0000000-0000-4000-8000-000000000004'$$,
  $$values (null::timestamptz, true)$$,
  'spectating creates the association with last_viewed_at and no last_connected_at'
);

select results_eq(
  $$select driver_id from (table public.rig_drivers except table before_drivers) d$$,
  $$values ('a0000000-0000-4000-8000-000000000004'::uuid)$$,
  'spectating adds exactly one rig_drivers row'
);

select is_empty(
  $$table before_drivers except table public.rig_drivers$$,
  'spectating changes no other rig_drivers row'
);

select is_empty(
  $$(table public.rig_session except table before_sessions) union all (table before_sessions except table public.rig_session)$$,
  'spectating leaves rig_session untouched (no session created, last_activity_at unchanged)'
);

select is_empty(
  $$(select to_jsonb(s) from public.rig_stats s except select to_jsonb(b) from before_stats b)
    union all
    (select to_jsonb(b) from before_stats b except select to_jsonb(s) from public.rig_stats s)$$,
  'spectating leaves rig_stats untouched'
);

-- Spectate twice: only last_viewed_at moves -----------------------------------

update public.rig_drivers set last_viewed_at = now() - interval '1 day'
where rig_id = 'b0000000-0000-4000-8000-000000000002' and driver_id = 'a0000000-0000-4000-8000-000000000004';
create temporary table first_view as
select id, created_at, last_connected_at from public.rig_drivers
where rig_id = 'b0000000-0000-4000-8000-000000000002' and driver_id = 'a0000000-0000-4000-8000-000000000004';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000004", "role": "authenticated"}', true);
select is(public.spectate_rig('b0000000-0000-4000-8000-000000000002'), 'ok', 'spectating again returns ok');
reset role;

select results_eq(
  $$select id, created_at, last_connected_at, last_viewed_at = now() from public.rig_drivers
    where rig_id = 'b0000000-0000-4000-8000-000000000002' and driver_id = 'a0000000-0000-4000-8000-000000000004'$$,
  $$select id, created_at, last_connected_at, true from first_view$$,
  'spectating twice keeps one row and updates last_viewed_at only'
);

select is_empty(
  $$(table public.rig_session except table before_sessions) union all (table before_sessions except table public.rig_session)$$,
  'spectating twice still leaves rig_session untouched'
);

-- A connected user spectating keeps their connect time -------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select is(public.spectate_rig('b0000000-0000-4000-8000-000000000002'), 'ok', 'the driver can spectate their own rig');
reset role;

select results_eq(
  $$select d.last_connected_at, d.last_viewed_at = now() from public.rig_drivers d
    where d.rig_id = 'b0000000-0000-4000-8000-000000000002' and d.driver_id = 'a0000000-0000-4000-8000-000000000003'$$,
  $$select last_connected_at, true from before_drivers
    where rig_id = 'b0000000-0000-4000-8000-000000000002' and driver_id = 'a0000000-0000-4000-8000-000000000003'$$,
  'spectating never touches last_connected_at'
);

-- Unknown rig ------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000004", "role": "authenticated"}', true);

select is(
  public.spectate_rig('00000000-0000-4000-8000-000000000000'),
  'not_found',
  'an unknown rig is not_found'
);

select results_eq(
  $$select rig_name, session_active, driver_name, driver_is_me, is_anonymous from public.get_my_rigs(120)$$,
  $$values ('Garagem'::text, true, 'carla'::text, false, false)$$,
  'after spectating, the rig is on the user''s list with its driver'
);

-- get_my_rigs: Alice's four rigs -----------------------------------------------

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select results_eq(
  $$select rig_name, session_active, driver_name, driver_is_me, is_anonymous from public.get_my_rigs(120)$$,
  $$values
    ('Escritório'::text, true, null::text, false, true),
    ('Garagem'::text, true, 'carla'::text, false, false),
    ('Cave'::text, false, null::text, false, false),
    ('Sala'::text, false, null::text, false, false)$$,
  'live rigs first, then by recency; anonymous, driven, expired and free statuses'
);

select results_eq(
  $$select last_used_at from public.get_my_rigs(120) where rig_name = 'Sala'$$,
  $$select greatest(last_connected_at, last_viewed_at) from public.rig_drivers
    where rig_id = 'b0000000-0000-4000-8000-000000000001' and driver_id = 'a0000000-0000-4000-8000-000000000001'$$,
  'last used is the later of last_connected_at and last_viewed_at'
);

-- Expired: the same rule in get_my_rigs and rig_status --------------------------

select is(
  (select session_active from public.rig_status('b0000000-0000-4000-8000-000000000004', 120)),
  false,
  'rig_status reports the expired session as inactive'
);

select is(
  (select session_active from public.get_my_rigs(120) where rig_name = 'Cave'),
  (select session_active from public.rig_status('b0000000-0000-4000-8000-000000000004', 120)),
  'get_my_rigs and rig_status agree on the expired session'
);

select is(
  (select session_active from public.get_my_rigs(300) where rig_name = 'Cave'),
  (select session_active from public.rig_status('b0000000-0000-4000-8000-000000000004', 300)),
  'and agree with a longer timeout, under which it is active'
);

reset role;

select is(
  (select ended_at from public.rig_session where id = md5('session-expired')::uuid),
  null,
  'reading statuses writes nothing: the expired session is still open'
);

-- Carla: red carpet; Bruno: spectate-only ---------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);

select results_eq(
  $$select rig_name, session_active, driver_is_me from public.get_my_rigs(120)$$,
  $$values ('Garagem'::text, true, true)$$,
  'the driver sees their rig as driven by them'
);

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);

select results_eq(
  $$select rig_name, last_used_at from public.get_my_rigs(120)$$,
  $$select 'Garagem'::text, last_viewed_at from public.rig_drivers
    where driver_id = 'a0000000-0000-4000-8000-000000000002'$$,
  'a spectate-only rig is listed, last used = last viewed'
);

-- user_tip ---------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$insert into public.user_tip (user_id, tip_key) values ('a0000000-0000-4000-8000-000000000001', 'rig_saved')
    on conflict do nothing;
    insert into public.user_tip (user_id, tip_key) values ('a0000000-0000-4000-8000-000000000001', 'rig_saved')
    on conflict do nothing$$,
  'a user can dismiss a tip, and dismissing it again is a no-op'
);

select throws_ok(
  $$insert into public.user_tip (user_id, tip_key) values ('a0000000-0000-4000-8000-000000000002', 'rig_saved')$$,
  '42501', null, 'a user cannot dismiss a tip for someone else'
);

select throws_ok(
  $$insert into public.user_tip (user_id, tip_key) values ('a0000000-0000-4000-8000-000000000001', 'Rig Saved!')$$,
  '23514', null, 'a malformed tip key is refused'
);

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);

select is_empty(
  $$select * from public.user_tip$$,
  'a user cannot see someone else''s dismissals'
);

reset role;

select * from finish();
rollback;
