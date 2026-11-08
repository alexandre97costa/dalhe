-- The homepage rig card shows the driver's avatar, so get_my_rigs returns it too.
--
-- Adding a column changes the return type, which create or replace can't do, so
-- the function is dropped and recreated. That loses its grants: same access as
-- before, authenticated only. Body unchanged apart from p.avatar_url.

drop function public.get_my_rigs(integer);

create function public.get_my_rigs(p_expiry_minutes integer)
returns table (
  rig_id uuid,
  rig_name text,
  session_active boolean,
  driver_name text,
  driver_avatar_url text,
  driver_is_me boolean,
  is_anonymous boolean,
  last_used_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.name,
    s.id is not null,
    p.username,
    p.avatar_url,
    coalesce(s.driver_id = auth.uid(), false),
    s.id is not null and s.driver_id is null,
    greatest(rd.last_connected_at, rd.last_viewed_at)
  from public.rig_drivers rd
  join public.rig r on r.id = rd.rig_id
  left join lateral public.rig_active_session(r.id, p_expiry_minutes) s on true
  left join public.profiles p on p.id = s.driver_id
  where rd.driver_id = auth.uid()
  order by
    s.id is not null desc,
    greatest(rd.last_connected_at, rd.last_viewed_at) desc nulls last,
    r.name;
$$;

revoke execute on function public.get_my_rigs(integer) from public, anon, authenticated;
grant execute on function public.get_my_rigs(integer) to authenticated;
