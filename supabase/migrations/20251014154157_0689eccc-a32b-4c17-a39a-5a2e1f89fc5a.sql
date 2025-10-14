-- Corriger get_user_profile_data pour utiliser $1 au lieu de user_id
CREATE OR REPLACE FUNCTION public.get_user_profile_data(user_id uuid)
RETURNS TABLE(first_name text, last_name text, role text, id_client uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.first_name,
    p.last_name,
    COALESCE(ur.role::text, 'user') as role,
    p.id_client
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = $1
  LIMIT 1;
$$;