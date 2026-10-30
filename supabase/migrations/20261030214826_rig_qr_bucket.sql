-- QR codes for the SimHub overlay, one per rig: `rig-qr/<rig uuid>.png`, encoding the rig's
-- connect URL (the UUID only, never the key). Sprint 1.5, X3.
--
-- Public, so the overlay (no auth headers) and anyone can read an image through the public URL:
--   <supabase url>/storage/v1/object/public/rig-qr/<rig uuid>.png
-- No storage.objects policies for anon or authenticated: there are no client writes. Images are
-- uploaded by hand (Studio → Storage) or by the service role.
-- Locally the bucket is also declared in config.toml ([storage.buckets.rig-qr]), which uploads the
-- seed rigs' QR images on `supabase start` / `db reset`. Keep the two in sync.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rig-qr', 'rig-qr', true, 1048576, array['image/png'])
on conflict (id) do nothing;
