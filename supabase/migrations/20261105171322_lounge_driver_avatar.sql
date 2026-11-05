-- The lounge header shows the driver's avatar, so rig_status returns it too.
--
-- Adding a column changes the return type, which create or replace can't do, so
-- the function is dropped and recreated. That loses its grants: same access as
-- before, authenticated (connect and lounge pages) and service_role (rig
-- endpoints). Rig endpoints only send the fields listed in pollResponse, so the
-- avatar URL doesn't reach the overlay.

drop function public.rig_status(uuid, integer);

create function public.rig_status(p_rig_id uuid, p_expiry_minutes integer)
returns table (
  rig_id uuid,
  rig_name text,
  session_active boolean,
  session_id uuid,
  driver_id uuid,
  driver_name text,
  driver_avatar_url text
)
language sql
stable
as $$
  select
    r.id,
    r.name,
    s.id is not null,
    s.id,
    s.driver_id,
    p.username,
    p.avatar_url
  from rig r
  left join lateral (
    select id, driver_id
    from rig_session
    where rig_id = r.id
      and ended_at is null
      and last_activity_at > now() - make_interval(mins => p_expiry_minutes)
    order by last_activity_at desc
    limit 1
  ) s on true
  left join profiles p on p.id = s.driver_id
  where r.id = p_rig_id;
$$;

revoke execute on function public.rig_status(uuid, integer) from public, anon, authenticated;
grant execute on function public.rig_status(uuid, integer) to authenticated, service_role;
