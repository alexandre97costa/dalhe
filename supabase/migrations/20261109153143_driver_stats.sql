-- A driver's profile stats in one call. The app used PostgREST aggregates (count(), sum()),
-- which Supabase disables by default, so the Stats tab always showed 0.
-- Filters on for_testing like get_driver_timeline, so the stats match the laps the profile lists.

create function public.get_driver_stats(p_driver_id uuid, p_testing boolean)
returns table (poles integer, podiums integer, dominance integer, total_laps integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) filter (where l.pole_rating > 0)::integer,
    count(*) filter (where l.was_podium)::integer,
    coalesce(sum(l.pole_rating), 0)::integer,
    count(*)::integer
  from public.lap_time l
  where l.driver_id = p_driver_id
    and l.for_testing = p_testing;
$$;

revoke execute on function public.get_driver_stats(uuid, boolean) from public, anon;
grant execute on function public.get_driver_stats(uuid, boolean) to authenticated;
