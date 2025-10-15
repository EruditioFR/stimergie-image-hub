-- Fonction pour récupérer tous les IDs clients d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_client_ids(user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    CASE 
      WHEN client_ids IS NOT NULL AND array_length(client_ids, 1) > 0 
      THEN client_ids
      WHEN id_client IS NOT NULL 
      THEN ARRAY[id_client]
      ELSE ARRAY[]::uuid[]
    END,
    ARRAY[]::uuid[]
  )
  FROM profiles
  WHERE id = user_id;
$$;

-- Mise à jour de get_accessible_projects pour supporter plusieurs clients
CREATE OR REPLACE FUNCTION public.get_accessible_projects(user_id uuid, check_time timestamp with time zone DEFAULT now())
RETURNS TABLE(project_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_client_ids UUID[];
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Les admins ont accès à tous les projets
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id
    FROM public.projets p;
    RETURN;
  END IF;
  
  -- Récupérer tous les IDs clients de l'utilisateur
  user_client_ids := public.get_user_client_ids(user_id);
  
  -- Pour admin_client: retourner TOUS les projets de TOUS leurs clients
  IF user_role = 'admin_client' AND array_length(user_client_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM public.projets p
    WHERE p.id_client = ANY(user_client_ids);
    RETURN;
  END IF;
  
  -- Pour les users: retourner les projets avec périodes d'accès actives pour TOUS leurs clients
  IF user_role = 'user' AND array_length(user_client_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM public.projets p
    JOIN public.project_access_periods pap ON p.id = pap.project_id
    WHERE pap.client_id = ANY(user_client_ids)
    AND pap.is_active = true
    AND check_time >= pap.access_start
    AND check_time <= pap.access_end;
    RETURN;
  END IF;
  
  -- Par défaut, aucun projet accessible
  RETURN;
END;
$$;

-- Mise à jour de get_accessible_projects_details pour supporter plusieurs clients
CREATE OR REPLACE FUNCTION public.get_accessible_projects_details(p_user_id uuid, p_check_time timestamp with time zone DEFAULT now())
RETURNS TABLE(id uuid, nom_projet character varying, nom_dossier text, type_projet character varying, id_client uuid, created_at timestamp with time zone, client_id uuid, client_nom text, client_logo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_client_ids UUID[];
  v_is_admin BOOLEAN;
  v_is_admin_client BOOLEAN;
BEGIN
  -- Récupérer tous les IDs clients de l'utilisateur
  v_user_client_ids := public.get_user_client_ids(p_user_id);

  -- Vérifier les rôles depuis la table user_roles (source de vérité)
  SELECT public.has_role(p_user_id, 'admin'::app_role) INTO v_is_admin;
  SELECT public.has_role(p_user_id, 'admin_client'::app_role) INTO v_is_admin_client;

  -- Les admins ont accès à tous les projets
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
  
  -- Admin clients voient TOUS les projets de TOUS leurs clients (sans restriction de période)
  IF v_is_admin_client AND array_length(v_user_client_ids, 1) > 0 THEN
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
    WHERE p.id_client = ANY(v_user_client_ids)
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Les utilisateurs réguliers voient uniquement les projets avec périodes d'accès actives pour TOUS leurs clients
  IF array_length(v_user_client_ids, 1) > 0 THEN
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
    WHERE pap.client_id = ANY(v_user_client_ids)
    AND pap.is_active = true
    AND p_check_time >= pap.access_start
    AND p_check_time <= pap.access_end
    ORDER BY p.nom_projet;
    RETURN;
  END IF;
  
  -- Par défaut: aucun projet accessible
  RETURN;
END;
$$;