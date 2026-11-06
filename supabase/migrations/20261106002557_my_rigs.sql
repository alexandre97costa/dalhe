-- Sprint 2, D2: the homepage lists the user's rigs with their status.
--
-- One expiry rule: rig_active_session is the only place that decides whether a
-- rig's session is active (open, and active within the timeout). rig_status and
-- get_my_rigs both use it. The timeout stays the app's SESSION_TIMEOUT_MINS,
-- passed in as p_expiry_minutes, so it is configured in one place.

-- rig_active_session ------------------------------------------------------------
-- The rig's active session, or no row. Read-only: an expired session is just
-- not returned (lazy expiry), never closed here.
-- Internal: not executable by any API role; only the security definer
-- functions below (owned by postgres) call it.

create function public.rig_active_session(p_rig_id uuid, p_expiry_minutes integer)
returns table (id uuid, driver_id uuid)
language sql
stable
set search_path = ''
as $$
  select s.id, s.driver_id
  from public.rig_session s
  where s.rig_id = p_rig_id
    and s.ended_at is null
    and s.last_activity_at > now() - make_interval(mins => p_expiry_minutes)
  order by s.last_activity_at desc
  limit 1;
$$;

revoke execute on function public.rig_active_session(uuid, integer) from public, anon, authenticated, service_role;

-- rig_status --------------------------------------------------------------------
-- Same signature, result and grants (authenticated, service_role); now uses the
-- shared rule. Security definer so it can call rig_active_session; everything
-- it reads (rig, rig_session, profiles) is readable by both roles anyway.

create or replace function public.rig_status(p_rig_id uuid, p_expiry_minutes integer)
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
security definer
set search_path = ''
as $$
  select
    r.id,
    r.name,
    s.id is not null,
    s.id,
    s.driver_id,
    p.username,
    p.avatar_url
  from public.rig r
  left join lateral public.rig_active_session(r.id, p_expiry_minutes) s on true
  left join public.profiles p on p.id = s.driver_id
  where r.id = p_rig_id;
$$;

-- Restated after the change to security definer: same access as before.
revoke execute on function public.rig_status(uuid, integer) from public, anon, authenticated;
grant execute on function public.rig_status(uuid, integer) to authenticated, service_role;

-- get_my_rigs -------------------------------------------------------------------
-- One row per rig the user is associated with (connected or spectated).
-- last_used_at is the later of last_connected_at and last_viewed_at.
-- Ordered for the homepage: rigs with an active session first, then the most
-- recently used. Read-only.

create function public.get_my_rigs(p_expiry_minutes integer)
returns table (
  rig_id uuid,
  rig_name text,
  session_active boolean,
  driver_name text,
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

-- The unique key leads with rig_id; get_my_rigs looks rows up by driver.
create index rig_drivers_driver_id_idx on public.rig_drivers (driver_id);
