-- Profile avatars: users upload their own picture, everyone can see it.
--
-- The avatars bucket already exists (hosted, and locally through config.toml), private and
-- with no limits. It becomes public so an <img> can load an avatar through its public URL:
--   <supabase url>/storage/v1/object/public/avatars/<user id>/avatar.webp
-- profiles.avatar_url keeps holding a full URL, so avatars from sign-up metadata still work.
-- Locally the bucket settings also live in config.toml ([storage.buckets.avatars]); keep the
-- two in sync.
--
-- Write policies: the old "Anyone can upload an avatar." let anyone, logged in or not, upload
-- any file into the bucket (backlog, from Sprint 0 S2). Now only a logged-in user, and only
-- inside their own folder (`<auth.uid()>/…`). Update and delete are needed for replacing the
-- picture (upload with upsert). The public select policy stays.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy "Anyone can upload an avatar." on storage.objects;

create policy "Users can upload their own avatar."
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own avatar."
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own avatar."
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
