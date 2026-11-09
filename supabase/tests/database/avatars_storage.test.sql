-- Avatar storage: everyone can read, only the owner can write, and only in their own folder.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Alice is a…01, Bruno a…02.

begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

-- Bucket ----------------------------------------------------------------------

select is(
  (select public from storage.buckets where id = 'avatars'),
  true,
  'avatars bucket is public'
);

select is(
  (select file_size_limit from storage.buckets where id = 'avatars'),
  2097152::bigint,
  'avatars bucket is limited to 2 MiB'
);

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Anyone can upload an avatar.'),
  0,
  'the open upload policy is gone'
);

-- Fixture: one avatar of Bruno's, inserted as postgres
insert into storage.objects (bucket_id, name, owner_id)
values ('avatars', 'a0000000-0000-4000-8000-000000000002/avatar.webp', 'a0000000-0000-4000-8000-000000000002');

-- anon ------------------------------------------------------------------------

set local role anon;

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', 'anon/avatar.webp')$$,
  '42501', null, 'anon cannot upload an avatar'
);

select is(
  (select count(*)::int from storage.objects
    where bucket_id = 'avatars' and name = 'a0000000-0000-4000-8000-000000000002/avatar.webp'),
  1,
  'anon can see avatars'
);

reset role;

-- Alice -----------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('avatars', 'a0000000-0000-4000-8000-000000000001/avatar.webp', 'a0000000-0000-4000-8000-000000000001')$$,
  'Alice can upload into her own folder'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars', 'a0000000-0000-4000-8000-000000000002/avatar.webp')$$,
  '42501', null, 'Alice cannot upload into Bruno''s folder'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', 'avatar.webp')$$,
  '42501', null, 'Alice cannot upload outside a folder'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('rig-qr', 'a0000000-0000-4000-8000-000000000001/avatar.webp')$$,
  '42501', null, 'the avatar policy does not open other buckets'
);

update storage.objects set metadata = '{"replaced": true}'
where bucket_id = 'avatars' and name = 'a0000000-0000-4000-8000-000000000001/avatar.webp';

update storage.objects set metadata = '{"replaced": true}'
where bucket_id = 'avatars' and name = 'a0000000-0000-4000-8000-000000000002/avatar.webp';

reset role;

select is(
  (select metadata from storage.objects
    where bucket_id = 'avatars' and name = 'a0000000-0000-4000-8000-000000000001/avatar.webp'),
  '{"replaced": true}'::jsonb,
  'Alice can replace her own avatar'
);

select is(
  (select metadata from storage.objects
    where bucket_id = 'avatars' and name = 'a0000000-0000-4000-8000-000000000002/avatar.webp'),
  null,
  'Alice cannot replace Bruno''s avatar'
);

-- Storage refuses direct SQL deletes (storage.protect_delete), so the delete policy is
-- checked by its definition: authenticated only, own folder only.
select ok(
  (select roles = array['authenticated']::name[]
      and qual like '%foldername(name)%auth.uid()%'
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users can delete their own avatar.'),
  'deleting is limited to the owner''s folder'
);

select * from finish();
rollback;
