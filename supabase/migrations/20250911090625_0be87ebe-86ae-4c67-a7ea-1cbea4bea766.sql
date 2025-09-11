-- Drop the existing restrictive policy that causes inconsistency
DROP POLICY IF EXISTS "Users can view accessible projects via access periods" ON public.projets;

-- Create a simpler, more direct policy for users
CREATE POLICY "Users can view projects with active access" ON public.projets
FOR SELECT USING (
  -- Admins can see all projects
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  OR
  -- Admin clients can see their client's projects  
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_client' AND id_client = projets.id_client))
  OR
  -- Users can see projects they have active access to via access periods
  (EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.project_access_periods pap ON pap.client_id = p.id_client
    WHERE p.id = auth.uid()
    AND p.role = 'user'
    AND pap.project_id = projets.id
    AND pap.is_active = true
    AND now() >= pap.access_start
    AND now() <= pap.access_end
  ))
);