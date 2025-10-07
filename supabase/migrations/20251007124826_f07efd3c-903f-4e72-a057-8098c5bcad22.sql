-- Create function to get accessible projects with full details
-- This uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION public.get_accessible_projects_details(
  user_id uuid, 
  check_time timestamp with time zone DEFAULT now()
)
RETURNS TABLE(
  id uuid,
  nom_projet character varying,
  nom_dossier text,
  type_projet character varying,
  id_client uuid,
  created_at timestamp with time zone,
  client_id uuid,
  client_nom text,
  client_logo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_client_id UUID;
BEGIN
  -- Get user role and client_id
  SELECT role, id_client INTO user_role, user_client_id
  FROM public.profiles
  WHERE id = user_id;
  
  -- Admins have access to all projects
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.nom_projet,
      p.nom_dossier,
      p.type_projet,
      p.id_client,
      p.created_at,
      c.id as client_id,
      c.nom as client_nom,
      c.logo as client_logo
    FROM public.projets p
    LEFT JOIN public.clients c ON c.id = p.id_client
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- For other roles, return projects with active access
  IF user_role IN ('admin_client', 'user') AND user_client_id IS NOT NULL THEN
    RETURN QUERY
    SELECT DISTINCT
      p.id,
      p.nom_projet,
      p.nom_dossier,
      p.type_projet,
      p.id_client,
      p.created_at,
      c.id as client_id,
      c.nom as client_nom,
      c.logo as client_logo
    FROM public.projets p
    LEFT JOIN public.clients c ON c.id = p.id_client
    JOIN public.project_access_periods pap ON p.id = pap.project_id
    WHERE pap.client_id = user_client_id
    AND pap.is_active = true
    AND check_time >= pap.access_start
    AND check_time <= pap.access_end
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Default: no projects accessible
  RETURN;
END;
$$;