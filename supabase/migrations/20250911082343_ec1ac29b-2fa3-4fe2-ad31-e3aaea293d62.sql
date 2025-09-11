-- Fix infinite recursion in profiles RLS policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can view their client profiles" ON public.profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id_client FROM public.profiles WHERE id = auth.uid();
$$;

-- Recreate the policies using the security definer functions
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admin clients can view their client profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.get_current_user_role() = 'admin_client' 
  AND public.get_current_user_client_id() = profiles.id_client
);

-- Update project access periods with correct dates
-- Fix the "Ecole Toussu le Noble" project period that starts on 2024-12-31
UPDATE public.project_access_periods 
SET access_start = '2024-01-01 00:00:00+00'::timestamp with time zone
WHERE access_start = '2024-12-31 00:00:00+00'::timestamp with time zone;

-- Ensure all access periods for ALIAD EDUCATION client are active
UPDATE public.project_access_periods 
SET 
  access_start = '2024-01-01 00:00:00+00'::timestamp with time zone,
  access_end = '2025-12-31 23:59:59+00'::timestamp with time zone,
  is_active = true
WHERE client_id IN (
  SELECT id FROM public.clients WHERE nom = 'ALIAD EDUCATION'
);