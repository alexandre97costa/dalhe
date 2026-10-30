-- Sprint 1, A4: upsert_rig_stats stores stats only while the rig has an active
-- session, and never creates a session or refreshes its activity.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed: rig "Sala" (b…01); rig "Garagem" (b…02) with Carla's active session.

begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

-- Fixtures: Garagem's session recent (known time), Sala free, no stats yet
update public.rig_session set last_activity_at = now() - interval '5 minutes'
where id = md5('session-active')::uuid;
update public.rig_session set ended_at = now()
where rig_id = 'b0000000-0000-4000-8000-000000000001' and ended_at is null;
delete from public.rig_stats;

set local role authenticated;
select throws_ok(
  $$select public.upsert_rig_stats('b0000000-0000-4000-8000-000000000002', 30, 'lap', '{}')$$,
  '42501', null, 'a user cannot call upsert_rig_stats'
);
reset role;

set local role service_role;

select is(
  public.upsert_rig_stats('b0000000-0000-4000-8000-000000000002', 30, 'session', '{"TrackId": "brands_hatch"}'),
  'ok',
  'session stats with an active session: ok'
);

select is(
  public.upsert_rig_stats('b0000000-0000-4000-8000-000000000002', 30, 'lap', '{"lapNumber": 3}'),
  'ok',
  'lap stats with an active session: ok'
);

select results_eq(
  $$select session_stats->>'TrackId', lap_stats->>'lapNumber' from public.rig_stats
    where id = 'b0000000-0000-4000-8000-000000000002'$$,
  $$values ('brands_hatch', '3')$$,
  'each kind fills its own column of the rig''s row'
);

select is(
  public.upsert_rig_stats('b0000000-0000-4000-8000-000000000002', 30, 'lap', '{"lapNumber": 4}'),
  'ok',
  'newer lap stats replace the old ones'
);

select results_eq(
  $$select session_stats->>'TrackId', lap_stats->>'lapNumber' from public.rig_stats
    where id = 'b0000000-0000-4000-8000-000000000002'$$,
  $$values ('brands_hatch', '4')$$,
  'only the latest values are kept, and the other kind is untouched'
);

select ok(
  (select last_activity_at < now() - interval '4 minutes' from public.rig_session where id = md5('session-active')::uuid),
  'stats never refresh the session''s activity'
);

-- No active session ------------------------------------------------------------

select is(
  public.upsert_rig_stats('b0000000-0000-4000-8000-000000000001', 30, 'lap', '{"lapNumber": 1}'),
  'ignored',
  'stats for a rig without a session are ignored'
);

select results_eq(
  $$select (select count(*)::int from public.rig_stats where id = 'b0000000-0000-4000-8000-000000000001'),
           (select count(*)::int from public.rig_session where rig_id = 'b0000000-0000-4000-8000-000000000001' and ended_at is null)$$,
  $$values (0, 0)$$,
  'ignored stats write no row and create no session'
);

reset role;
update public.rig_session set last_activity_at = now() - interval '31 minutes'
where id = md5('session-active')::uuid;
set local role service_role;

select is(
  public.upsert_rig_stats('b0000000-0000-4000-8000-000000000002', 30, 'lap', '{"lapNumber": 9}'),
  'ignored',
  'stats for a stale session are ignored'
);

select * from finish();
rollback;
