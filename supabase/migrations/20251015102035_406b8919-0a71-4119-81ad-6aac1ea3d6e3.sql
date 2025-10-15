-- Corriger get_accessible_projects pour utiliser user_roles (source de vérité) au lieu de profiles.role
-- Ceci garantit la cohérence avec les politiques RLS qui utilisent has_role()

CREATE OR REPLACE FUNCTION public.get_accessible_projects(user_id uuid, check_time timestamp with time zone DEFAULT now())
RETURNS TABLE(project_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_client_ids UUID[];
  v_is_admin BOOLEAN;
  v_is_admin_client BOOLEAN;
BEGIN
  -- Récupérer tous les IDs clients de l'utilisateur
  user_client_ids := public.get_user_client_ids(user_id);

  -- Vérifier les rôles depuis la table user_roles (source de vérité)
  SELECT public.has_role(user_id, 'admin'::app_role) INTO v_is_admin;
  SELECT public.has_role(user_id, 'admin_client'::app_role) INTO v_is_admin_client;

  -- Les admins ont accès à tous les projets
  IF v_is_admin THEN
    RETURN QUERY
    SELECT p.id
    FROM public.projets p
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Admin clients voient TOUS les projets de TOUS leurs clients (sans restriction de période)
  IF v_is_admin_client AND array_length(user_client_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM public.projets p
    WHERE p.id_client = ANY(user_client_ids)
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Les utilisateurs réguliers voient uniquement les projets avec périodes d'accès actives pour TOUS leurs clients
  IF array_length(user_client_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM public.projets p
    JOIN public.project_access_periods pap ON p.id = pap.project_id
    WHERE pap.client_id = ANY(user_client_ids)
    AND pap.is_active = true
    AND check_time >= pap.access_start
    AND check_time <= pap.access_end
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Par défaut: aucun projet accessible
  RETURN;
END;
$$;