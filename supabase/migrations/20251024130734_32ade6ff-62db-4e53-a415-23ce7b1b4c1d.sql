-- Drop existing policy
DROP POLICY IF EXISTS "Users can view projects with active access" ON public.projets;

-- Create new policy that allows viewing project info if user can access images from it
CREATE POLICY "Users can view projects with active access or image access"
ON public.projets
FOR SELECT
USING (
  -- Admins can see all projects
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Admin clients can see their clients' projects
  (has_role(auth.uid(), 'admin_client'::app_role) AND (id_client = ANY (get_user_client_ids(auth.uid()))))
  OR
  -- Users can see projects with active access periods
  (EXISTS (
    SELECT 1
    FROM project_access_periods pap
    WHERE pap.project_id = projets.id
      AND pap.client_id = ANY (get_user_client_ids(auth.uid()))
      AND pap.is_active = true
      AND now() >= pap.access_start
      AND now() <= pap.access_end
  ))
  OR
  -- Users can see project info if they have access to at least one image from this project
  -- Since images.RLS allows viewing (true), this lets users see project metadata for displayable images
  (EXISTS (
    SELECT 1
    FROM images i
    WHERE i.id_projet = projets.id
  ))
);