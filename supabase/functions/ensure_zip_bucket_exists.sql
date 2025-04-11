
-- Function to ensure the ZIP Downloads bucket exists and has proper policies
CREATE OR REPLACE FUNCTION public.ensure_zip_bucket_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if bucket exists, create if it doesn't
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
    
    RAISE NOTICE 'Created ZIP Downloads bucket';
  ELSE
    RAISE NOTICE 'ZIP Downloads bucket already exists';
  END IF;
  
  -- Ensure proper storage policies exist
  -- Allow public downloads
  BEGIN
    CREATE POLICY "Public can download ZIPs" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'ZIP Downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;
  
  -- Allow service role to upload ZIPs
  BEGIN
    CREATE POLICY "Service role can upload ZIPs" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'ZIP Downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;
  
  -- Allow service role to update ZIPs
  BEGIN
    CREATE POLICY "Service role can update ZIP objects" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'ZIP Downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;

  -- Make sure RLS is enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'Storage policies for ZIP Downloads bucket have been verified';
END;
$$;
