-- Sprint 1, A1: rig keys are readable only by the service role (the rig endpoints).
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.

begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select is(
  (select count(*)::int from public.rig r
   where not exists (select 1 from public.rig_key k where k.rig_id = r.id)),
  0,
  'every rig has a key'
);

select is(
  (select count(*)::int from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rig_key'),
  0,
  'rig_key is not broadcast by realtime'
);

insert into public.rig (id, name) values ('b0000000-0000-4000-8000-0000000000ff', 'Test rig');
insert into public.rig_key (rig_id) values ('b0000000-0000-4000-8000-0000000000ff');
select matches(
  (select api_key from public.rig_key where rig_id = 'b0000000-0000-4000-8000-0000000000ff'),
  '^[0-9a-f]{32}$',
  'a new key defaults to 32 random hex characters'
);

set local role anon;

select throws_ok(
  $$select api_key from public.rig_key$$,
  '42501', null, 'anon cannot read rig_key'
);

reset role;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$select api_key from public.rig_key$$,
  '42501', null, 'a user cannot read rig_key'
);

reset role;
set local role service_role;

select is(
  (select api_key from public.rig_key where rig_id = 'b0000000-0000-4000-8000-000000000001'),
  'local-sala-key',
  'the service role can read a rig''s key'
);

select * from finish();
rollback;
