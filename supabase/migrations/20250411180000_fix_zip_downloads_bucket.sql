
-- Configure the ZIP Downloads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ZIP Downloads', 'ZIP Downloads', true)
ON CONFLICT (id) DO UPDATE
SET public = true; -- Make it public for easier access to download links

-- Clear existing policies to avoid conflicts
DELETE FROM storage.policies 
WHERE bucket_id = 'ZIP Downloads';

-- Create policy for authenticated users to read ZIPs
CREATE POLICY "Authenticated users can read ZIPs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ZIP Downloads' AND auth.role() = 'authenticated');

-- Create policy for service role to upload ZIPs
CREATE POLICY "Service role can upload ZIPs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'ZIP Downloads');

-- Allow service role to update objects
CREATE POLICY "Service role can update ZIP objects"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'ZIP Downloads');

-- Allow service role to delete objects
CREATE POLICY "Service role can delete ZIP objects"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'ZIP Downloads');

-- Everyone can read ZIPs if they have the URL
CREATE POLICY "Public can download ZIPs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ZIP Downloads');

-- Ensure RLS is enabled on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
