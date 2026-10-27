-- Baseline, part 2: objects the hosted project has in the Supabase-managed
-- auth and storage schemas, which `supabase db dump` (public only) leaves out.
-- Copied from the hosted catalog on 2026-10-27. The avatars bucket itself is
-- declared in config.toml ([storage.buckets.avatars]).

-- Create a profile row for every new auth user.
CREATE OR REPLACE TRIGGER "on_auth_user_created"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- Avatar storage policies.
CREATE POLICY "Anyone can upload an avatar."
    ON "storage"."objects"
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (("bucket_id" = 'avatars'::"text"));

CREATE POLICY "Avatar images are publicly accessible."
    ON "storage"."objects"
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (("bucket_id" = 'avatars'::"text"));
