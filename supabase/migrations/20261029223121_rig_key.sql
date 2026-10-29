-- Sprint 1, A1: every rig endpoint requires the rig's secret key (?k=).
-- The rig id is public (QR code, URLs); the key lives only here and in the
-- overlay config. Kept out of `rig`, which is publicly readable and broadcast
-- by realtime. Read only by the rig endpoints (service role).

create table public.rig_key (
  rig_id uuid primary key references public.rig (id) on delete cascade,
  api_key text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

comment on table public.rig_key is
  'Secret key per rig, required by every /rig/[id] endpoint. Service role only. To change a key: update api_key, then paste it into the overlay config.';

alter table public.rig_key enable row level security;

-- Supabase's default privileges grant every new table to anon and authenticated
revoke all on table public.rig_key from anon, authenticated;

-- A random key for every existing rig
insert into public.rig_key (rig_id)
select id from public.rig;
