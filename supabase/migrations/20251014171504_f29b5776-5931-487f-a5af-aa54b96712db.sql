-- Fix get_accessible_projects_details to use user_roles table instead of profiles.role
-- This ensures admin_client users see only their client's projects

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
SET search_path TO 'public'
AS $$
DECLARE
  v_user_client_id UUID;
  v_is_admin BOOLEAN;
  v_is_admin_client BOOLEAN;
BEGIN
  -- Get user's client_id from profiles
  SELECT prof.id_client 
  INTO v_user_client_id
  FROM public.profiles prof
  WHERE prof.id = p_user_id;

  -- Check roles from user_roles table (source of truth)
  SELECT public.has_role(p_user_id, 'admin'::app_role) INTO v_is_admin;
  SELECT public.has_role(p_user_id, 'admin_client'::app_role) INTO v_is_admin_client;

  -- Admins have access to all projects
  IF v_is_admin THEN
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
  
  -- Admin clients see ALL projects of their client (no access period restriction)
  IF v_is_admin_client AND v_user_client_id IS NOT NULL THEN
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
    WHERE p.id_client = v_user_client_id
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Regular users see only projects with active access periods
  IF v_user_client_id IS NOT NULL THEN
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