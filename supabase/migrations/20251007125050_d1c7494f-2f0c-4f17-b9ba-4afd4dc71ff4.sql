-- Fix the ambiguous column reference in get_accessible_projects_details
DROP FUNCTION IF EXISTS public.get_accessible_projects_details(uuid, timestamp with time zone);

CREATE OR REPLACE FUNCTION public.get_accessible_projects_details(
  p_user_id uuid, 
  p_check_time timestamp with time zone DEFAULT now()
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
  v_user_role TEXT;
  v_user_client_id UUID;
BEGIN
  -- Get user role and client_id
  SELECT prof.role, prof.id_client 
  INTO v_user_role, v_user_client_id
  FROM public.profiles prof
  WHERE prof.id = p_user_id;
  
  -- Admins have access to all projects
  IF v_user_role = 'admin' THEN
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
  IF v_user_role IN ('admin_client', 'user') AND v_user_client_id IS NOT NULL THEN
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
    WHERE pap.client_id = v_user_client_id
    AND pap.is_active = true
    AND p_check_time >= pap.access_start
    AND p_check_time <= pap.access_end
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Default: no projects accessible
  RETURN;
END;
$$;