
-- Function to ensure the ZIP Downloads bucket exists (idempotent)
CREATE OR REPLACE FUNCTION public.ensure_zip_bucket_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if bucket exists, create it if it doesn't
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'ZIP Downloads'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'ZIP Downloads',
      'ZIP Downloads',
      TRUE,
      52428800, -- 50MB limit
      ARRAY['application/zip', 'application/x-zip-compressed']::text[]
    );
  END IF;
  
  -- Make sure storage policies are created
  BEGIN
    CREATE POLICY "Anyone can download ZIPs"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'ZIP Downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;
  
  BEGIN
    CREATE POLICY "Service roles can upload ZIPs"
    ON storage.objects 
    FOR INSERT
    WITH CHECK (bucket_id = 'ZIP Downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;
END;
$$;

-- Execute the function to ensure bucket exists
SELECT public.ensure_zip_bucket_exists();
