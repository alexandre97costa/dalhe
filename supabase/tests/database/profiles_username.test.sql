-- Usernames are unique regardless of case.
-- Runs against the seed (pnpm exec supabase test db). Everything is rolled back.
--
-- Seed usernames: alice (a…01), bruno (a…02), carla (a…03), diogo (a…04).

begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

select has_index('public', 'profiles', 'profiles_username_lower_key', 'case-insensitive username index exists');

select throws_ok(
  $$update public.profiles set username = 'carla' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  '23505', null, 'exact duplicate is refused'
);

select throws_ok(
  $$update public.profiles set username = 'Carla' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  '23505', null, 'duplicate in another case is refused'
);

select lives_ok(
  $$update public.profiles set username = 'Alice' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'changing the case of your own username is allowed'
);

select lives_ok(
  $$update public.profiles set username = 'alice2' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'a new username is allowed'
);

select * from finish();
rollback;
