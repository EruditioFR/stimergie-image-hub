-- Add client_ids array column to profiles table
ALTER TABLE public.profiles ADD COLUMN client_ids UUID[];

-- Migrate existing id_client data to client_ids array
UPDATE public.profiles 
SET client_ids = CASE 
  WHEN id_client IS NOT NULL THEN ARRAY[id_client]
  ELSE NULL 
END;

-- Update RLS policies to work with both id_client and client_ids
DROP POLICY IF EXISTS "Users can view profiles from their client" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can manage their client users" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can view their client users" ON public.profiles;

-- Create new policies that support both single and multiple client access
CREATE POLICY "Users can view profiles from their client" ON public.profiles
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM public.profiles p2 
    WHERE p2.role = 'admin' 
    OR p2.id_client = profiles.id_client
    OR (p2.client_ids IS NOT NULL AND profiles.id_client = ANY(p2.client_ids))
    OR (profiles.client_ids IS NOT NULL AND p2.id_client = ANY(profiles.client_ids))
  )
);

CREATE POLICY "Admin clients can manage their client users" ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.id = auth.uid() 
    AND (
      p2.role = 'admin' 
      OR (p2.role = 'admin_client' AND (
        p2.id_client = profiles.id_client
        OR (p2.client_ids IS NOT NULL AND profiles.id_client = ANY(p2.client_ids))
        OR (profiles.client_ids IS NOT NULL AND p2.id_client = ANY(profiles.client_ids))
      ))
    )
  )
);

-- Create index on client_ids for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_ids ON public.profiles USING GIN(client_ids);