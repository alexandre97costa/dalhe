-- Sprint 2, D3: dismissed tips, per user, so a dismissal follows the user
-- across devices. Generic (tip_key) so later cards (e.g. "What's new") reuse it.
-- The keys live in $lib/config/tips.ts; the database only bounds their shape.
--
-- A dismissal is the user's own data: written by the client through RLS
-- (select and insert own rows), no rpc.

create table public.user_tip (
  user_id uuid not null references auth.users (id) on delete cascade,
  tip_key text not null check (tip_key ~ '^[a-z0-9_]{1,64}$'),
  dismissed_at timestamptz not null default now(),
  primary key (user_id, tip_key)
);

comment on table public.user_tip is 'Tips a user has dismissed (one row per user and tip key).';

alter table public.user_tip enable row level security;

create policy "Users can see their own dismissed tips" on public.user_tip
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can dismiss tips for themselves" on public.user_tip
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on table public.user_tip from public, anon, authenticated;
grant select, insert on table public.user_tip to authenticated;
grant all on table public.user_tip to service_role;
