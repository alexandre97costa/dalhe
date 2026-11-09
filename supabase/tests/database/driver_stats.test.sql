-- get_driver_stats: a driver's poles, podiums, pole rating total and lap count.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed users: alice (a…01), bruno (a…02). Expected values are computed from lap_time
-- directly, so the test doesn't depend on the seed's random contents.

begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
set local role authenticated;

select results_eq(
  $$select poles, podiums, dominance, total_laps
    from public.get_driver_stats('a0000000-0000-4000-8000-000000000001', false)$$,
  $$select count(*) filter (where pole_rating > 0)::integer,
           count(*) filter (where was_podium)::integer,
           coalesce(sum(pole_rating), 0)::integer,
           count(*)::integer
    from public.lap_time
    where driver_id = 'a0000000-0000-4000-8000-000000000001' and not for_testing$$,
  'stats match the driver''s non-test laps'
);

select ok(
  (select total_laps > 0 from public.get_driver_stats('a0000000-0000-4000-8000-000000000001', false)),
  'the seed driver has laps (the comparison above is not trivially empty)'
);

select is(
  (select total_laps from public.get_driver_stats('a0000000-0000-4000-8000-000000000001', true)),
  (select count(*)::integer from public.lap_time
   where driver_id = 'a0000000-0000-4000-8000-000000000001' and for_testing),
  'testing = true counts only test laps'
);

select results_eq(
  $$select poles, podiums, dominance, total_laps
    from public.get_driver_stats('a0000000-0000-4000-8000-0000000000ff', false)$$,
  $$values (0, 0, 0, 0)$$,
  'a driver with no laps gets zeros, not nulls'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.get_driver_stats('a0000000-0000-4000-8000-000000000001', false)$$,
  '42501', null, 'anon cannot call get_driver_stats'
);

select * from finish();
rollback;
