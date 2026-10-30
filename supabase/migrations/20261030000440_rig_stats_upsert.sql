-- Sprint 1, A4: the overlay's live lap stats (/send/live) and sim session
-- stats (/send/session) land in the rig's rig_stats row (latest values only).
-- Stored only while the rig has an active session; otherwise nothing is
-- written ('ignored'). Never creates a session, never touches last_activity_at.

create function public.upsert_rig_stats(
  p_rig_id uuid,
  p_timeout_minutes integer,
  p_kind text,
  p_stats json
) returns text
language plpgsql
set search_path = ''
as $$
begin
  if p_kind not in ('lap', 'session') then
    raise exception 'unknown stats kind: %', p_kind using errcode = '22023';
  end if;

  -- active = open and recent, same rule as rig_status; a stale session is not closed here
  if not exists (
    select 1 from public.rig_session s
    where s.rig_id = p_rig_id
      and s.ended_at is null
      and s.last_activity_at > now() - make_interval(mins => p_timeout_minutes)
  ) then
    return 'ignored';
  end if;

  if p_kind = 'lap' then
    insert into public.rig_stats (id, lap_stats, lap_updated_at)
    values (p_rig_id, p_stats, now())
    on conflict (id) do update
    set lap_stats = excluded.lap_stats, lap_updated_at = excluded.lap_updated_at;
  else
    insert into public.rig_stats (id, session_stats, session_updated_at)
    values (p_rig_id, p_stats, now())
    on conflict (id) do update
    set session_stats = excluded.session_stats, session_updated_at = excluded.session_updated_at;
  end if;

  return 'ok';
end;
$$;

-- Rig endpoints only
revoke execute on function public.upsert_rig_stats(uuid, integer, text, json) from public, anon, authenticated;
grant execute on function public.upsert_rig_stats(uuid, integer, text, json) to service_role;
