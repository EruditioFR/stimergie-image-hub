
-- Function to ensure the ZIP downloads bucket exists and has proper policies
CREATE OR REPLACE FUNCTION public.ensure_zip_bucket_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if bucket exists, create if it doesn't
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'zip_downloads'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'zip_downloads',
      'ZIP Downloads',
      TRUE,
      52428800, -- 50MB limit
      ARRAY['application/zip', 'application/x-zip-compressed']::text[]
    );
    
    RAISE NOTICE 'Created zip_downloads bucket';
  ELSE
    RAISE NOTICE 'zip_downloads bucket already exists';
  END IF;
  
  -- Ensure proper storage policies exist
  -- Allow public downloads
  BEGIN
    CREATE POLICY "Public can download ZIPs" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'zip_downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;
  
  -- Allow service role to upload ZIPs
  BEGIN
    CREATE POLICY "Service role can upload ZIPs" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'zip_downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;
  
  -- Allow service role to update ZIPs
  BEGIN
    CREATE POLICY "Service role can update ZIP objects" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'zip_downloads');
  EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Policy already exists
  END;

  -- Make sure RLS is enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  
  -- Add tables to the realtime publication for change listening
  -- Check if the supabase_realtime publication contains our table
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'download_requests'
  ) THEN
    -- Add the download_requests table to the realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.download_requests;
    RAISE NOTICE 'Added download_requests table to supabase_realtime publication';
  END IF;

  -- Make sure download_requests has full replica identity for realtime to work properly
  ALTER TABLE public.download_requests REPLICA IDENTITY FULL;
  
  RAISE NOTICE 'Storage policies for zip_downloads bucket have been verified';
  RAISE NOTICE 'Realtime configuration for downloads has been verified';
END;
$$;
