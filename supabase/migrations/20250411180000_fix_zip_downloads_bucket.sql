
-- Fix for the zip-downloads bucket
-- First make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('zip-downloads', 'ZIP Downloads', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Clear existing policies to avoid conflicts
DELETE FROM storage.policies 
WHERE bucket_id = 'zip-downloads';

-- Create policy for authenticated users to read their zips
CREATE POLICY "Authenticated users can read ZIPs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'zip-downloads' AND auth.role() = 'authenticated');

-- Create policy for service role to upload ZIPs
CREATE POLICY "Service role can upload ZIPs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'zip-downloads');

-- Allow service role to update objects (for signed URLs)
CREATE POLICY "Service role can update ZIP objects"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'zip-downloads');

-- Allow service role to delete objects
CREATE POLICY "Service role can delete ZIP objects"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'zip-downloads');

-- Ensure RLS is enabled on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
