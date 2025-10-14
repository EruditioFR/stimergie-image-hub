-- Fix ambiguous column reference in get_users_with_roles function
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
  client_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_user_client_id UUID;
BEGIN
  -- Check if requesting user is admin
  SELECT public.has_role(get_users_with_roles.p_requesting_user_id, 'admin'::app_role) INTO v_is_admin;
  
  -- Get requesting user's client_id
  SELECT prof.id_client INTO v_user_client_id
  FROM public.profiles prof
  WHERE prof.id = get_users_with_roles.p_requesting_user_id;

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

  -- Admin_client users see only users from their client
  IF v_user_client_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.first_name,
      p.last_name,
      COALESCE(ur.role::text, 'user') as role,
      p.id_client,
      c.nom as client_name,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    LEFT JOIN public.clients c ON c.id = p.id_client
    WHERE 
      p.id_client = v_user_client_id
      AND (get_users_with_roles.p_filter_role IS NULL OR ur.role::text = get_users_with_roles.p_filter_role)
    ORDER BY p.email;
    RETURN;
  END IF;

  -- Default: no users visible
  RETURN;
END;
$$;