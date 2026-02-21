-- Fix RLS for the 'pdfs' storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public uploads to 'pdfs' bucket for development purposes
-- In production, this should be restricted to authenticated admin users
CREATE POLICY "Allow public uploads to pdfs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Allow public view to pdfs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pdfs');
