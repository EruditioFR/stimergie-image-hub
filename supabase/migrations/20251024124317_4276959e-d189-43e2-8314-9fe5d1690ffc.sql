-- Fix RLS policy on projets table to allow users to see project details for their accessible images

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view projects with active access" ON public.projets;

-- Create a new policy that properly handles multi-client support and access periods
CREATE POLICY "Users can view projects with active access"
ON public.projets
FOR SELECT
TO authenticated
USING (
  -- Admins can see all projects
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Admin clients can see projects from any of their clients
  (
    has_role(auth.uid(), 'admin_client'::app_role) 
    AND id_client = ANY(get_user_client_ids(auth.uid()))
  )
  OR
  -- Regular users can see projects they have active access to through any of their clients
  (
    EXISTS (
      SELECT 1 
      FROM project_access_periods pap
      WHERE pap.project_id = projets.id
        AND pap.client_id = ANY(get_user_client_ids(auth.uid()))
        AND pap.is_active = true
        AND now() >= pap.access_start
        AND now() <= pap.access_end
    )
  )
);