-- Corriger get_accessible_projects pour filtrer par id_client du projet
CREATE OR REPLACE FUNCTION public.get_accessible_projects(user_id uuid, check_time timestamp with time zone DEFAULT now())
RETURNS TABLE(project_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_client_id UUID;
BEGIN
  -- Récupérer le rôle et l'ID client de l'utilisateur
  SELECT role, id_client INTO user_role, user_client_id
  FROM public.profiles
  WHERE id = user_id;
  
  -- Les admins ont accès à tous les projets
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id
    FROM public.projets p;
    RETURN;
  END IF;
  
  -- Pour les autres rôles, retourner UNIQUEMENT les projets du client
  -- qui ont une période d'accès active
  IF user_role IN ('admin_client', 'user') AND user_client_id IS NOT NULL THEN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM public.projets p
    JOIN public.project_access_periods pap ON p.id = pap.project_id
    WHERE p.id_client = user_client_id
    AND pap.client_id = user_client_id
    AND pap.is_active = true
    AND check_time >= pap.access_start
    AND check_time <= pap.access_end;
    RETURN;
  END IF;
  
  -- Par défaut, aucun projet accessible
  RETURN;
END;
$$;