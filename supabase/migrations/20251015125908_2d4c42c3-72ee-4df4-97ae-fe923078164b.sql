-- Drop and recreate the function with multi-client support and admin exclusion
DROP FUNCTION IF EXISTS public.get_users_with_roles(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.get_users_with_roles(
  p_filter_client_id uuid DEFAULT NULL,
  p_filter_role text DEFAULT NULL,
  p_requesting_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  id_client uuid,
  client_ids uuid[],
  client_name text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin BOOLEAN;
  v_user_client_id UUID;
  v_user_client_ids UUID[];
BEGIN
  -- Check if requesting user is admin
  SELECT public.has_role(get_users_with_roles.p_requesting_user_id, 'admin'::app_role) INTO v_is_admin;
  
  -- Get requesting user's client_id AND client_ids
  SELECT prof.id_client, prof.client_ids INTO v_user_client_id, v_user_client_ids
  FROM public.profiles prof
  WHERE prof.id = get_users_with_roles.p_requesting_user_id;

  -- Build complete list of caller's client IDs
  IF v_user_client_ids IS NOT NULL AND array_length(v_user_client_ids, 1) > 0 THEN
    -- Multi-client: use client_ids
    NULL; -- v_user_client_ids is already set
  ELSIF v_user_client_id IS NOT NULL THEN
    -- Mono-client: use id_client
    v_user_client_ids := ARRAY[v_user_client_id];
  ELSE
    -- No clients assigned
    v_user_client_ids := ARRAY[]::uuid[];
  END IF;

  -- Admins see all users (with optional filters)
  IF v_is_admin THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.first_name,
      p.last_name,
      COALESCE(ur.role::text, 'user') as role,
      p.id_client,
      p.client_ids,
      c.nom as client_name,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    LEFT JOIN public.clients c ON c.id = p.id_client
    WHERE 
      (get_users_with_roles.p_filter_client_id IS NULL OR p.id_client = get_users_with_roles.p_filter_client_id)
      AND (get_users_with_roles.p_filter_role IS NULL OR ur.role::text = get_users_with_roles.p_filter_role)
    ORDER BY p.email;
    RETURN;
  END IF;

  -- Admin_client users see only users from their clients (excluding admins)
  IF array_length(v_user_client_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.first_name,
      p.last_name,
      COALESCE(ur.role::text, 'user') as role,
      p.id_client,
      p.client_ids,
      c.nom as client_name,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    LEFT JOIN public.clients c ON c.id = p.id_client
    WHERE 
      -- Check if user has at least one client in common
      (
        -- Check in client_ids array
        (p.client_ids IS NOT NULL AND p.client_ids && v_user_client_ids)
        OR
        -- Check in id_client (backward compatibility)
        (p.id_client IS NOT NULL AND p.id_client = ANY(v_user_client_ids))
      )
      -- EXCLUDE admin and admin_client roles
      AND (ur.role IS NULL OR ur.role::text = 'user')
      -- Apply optional role filter
      AND (get_users_with_roles.p_filter_role IS NULL OR ur.role::text = get_users_with_roles.p_filter_role)
    ORDER BY p.email;
    RETURN;
  END IF;

  -- Default: no users visible
  RETURN;
END;
$function$;