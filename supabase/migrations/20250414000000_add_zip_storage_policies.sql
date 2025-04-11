
-- Function to create proper storage policies for zip_downloads bucket
CREATE OR REPLACE FUNCTION public.create_zip_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'zip_downloads') THEN
    -- Allow authenticated users to read from the bucket
    BEGIN
      CREATE POLICY "Authenticated users can download their ZIPs"
        ON storage.objects
        FOR SELECT
        USING (bucket_id = 'zip_downloads' AND auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN
      NULL;  -- Policy already exists
    END;

    -- Allow system (via Edge Functions) to write to the bucket
    BEGIN
      CREATE POLICY "System can upload ZIPs"
        ON storage.objects
        FOR INSERT
        WITH CHECK (bucket_id = 'zip_downloads');
    EXCEPTION WHEN duplicate_object THEN
      NULL;  -- Policy already exists
    END;

    -- Add a policy for the system to update objects in the bucket (for signed URLs)
    BEGIN
      CREATE POLICY "System can update ZIP objects"
        ON storage.objects
        FOR UPDATE
        USING (bucket_id = 'zip_downloads');
    EXCEPTION WHEN duplicate_object THEN
      NULL;  -- Policy already exists
    END;
  END IF;
END;
$$;

-- Execute the function to ensure policies exist
SELECT public.create_zip_storage_policies();
