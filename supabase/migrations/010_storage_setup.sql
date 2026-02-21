-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Storage Setup Migration
-- Creates 'pdfs' storage bucket for Admin PDF uploads
-- ═══════════════════════════════════════════════════════════

-- 1. Create the 'pdfs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the storage schema (if not already enabled)
-- Note: 'storage.objects' often has RLS enabled by default or requires superuser to alter.
-- If you get a 42501 permission error, this can be safely ignored/commented out.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow all authenticated users to SELECT (Read) from 'pdfs' bucket
DROP POLICY IF EXISTS "Allow authenticated read for pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated read for pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pdfs');

-- 4. Policy: Allow all authenticated users to INSERT (Upload) to 'pdfs' bucket
DROP POLICY IF EXISTS "Allow authenticated insert for pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated insert for pdfs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pdfs');

-- 5. Policy: Allow all authenticated users to DELETE from 'pdfs' bucket
DROP POLICY IF EXISTS "Allow authenticated delete for pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated delete for pdfs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'pdfs');

-- 6. Policy: Allow all authenticated users to UPDATE in 'pdfs' bucket
DROP POLICY IF EXISTS "Allow authenticated update for pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated update for pdfs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'pdfs');
