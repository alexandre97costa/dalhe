-- Sprint 2, D1: spectating remembers the rig for the user.
--
-- A spectate-only association has never connected, so last_connected_at becomes
-- nullable. Its default stays: connect_to_rig sets it explicitly, and
-- spectate_rig inserts an explicit null.

alter table public.rig_drivers alter column last_connected_at drop not null;

alter table public.rig_drivers add column last_viewed_at timestamptz null;

comment on column public.rig_drivers.last_connected_at is
  'Last time the user connected to the rig (connect_to_rig). Null for an association made only by spectating.';
comment on column public.rig_drivers.last_viewed_at is
  'Last time the user pressed Spectate on the rig (spectate_rig). Null if they only ever connected.';

-- spectate_rig ----------------------------------------------------------------
-- Upserts the user's rig_drivers row and sets last_viewed_at. Spectating is not
-- a session event: it never touches rig_session, rig_stats, last_activity_at
-- or last_connected_at, and takes no lock on the rig (it can't hold up a
-- connect). The user comes from auth.uid(): there is no user argument.

create function public.spectate_rig(p_rig_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not exists (select 1 from public.rig where id = p_rig_id) then
    return 'not_found';
  end if;

  insert into public.rig_drivers (rig_id, driver_id, last_connected_at, last_viewed_at)
  values (p_rig_id, v_user_id, null, now())
  on conflict (rig_id, driver_id)
  do update set last_viewed_at = excluded.last_viewed_at;

  return 'ok';
end;
$$;

revoke execute on function public.spectate_rig(uuid) from public, anon, authenticated;
grant execute on function public.spectate_rig(uuid) to authenticated;
