-- 032_avatar_storage.sql
-- Creating 'avatars' storage bucket for profile pictures

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access (READ)
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policies for AUTHENTICATED upload (INSERT)
DROP POLICY IF EXISTS "Authenticated Avatar Upload" ON storage.objects;
CREATE POLICY "Authenticated Avatar Upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policies for AUTHENTICATED update (UPDATE)
DROP POLICY IF EXISTS "Authenticated Avatar Update" ON storage.objects;
CREATE POLICY "Authenticated Avatar Update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

-- Policies for AUTHENTICATED delete (DELETE)
DROP POLICY IF EXISTS "Authenticated Avatar Delete" ON storage.objects;
CREATE POLICY "Authenticated Avatar Delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');
