-- Fix infinite recursion in profiles table policies
-- The issue is policies that query the profiles table from within profiles table policies

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can view their client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their client" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can manage their client users" ON public.profiles;

-- Create simple, non-recursive policies
-- 1. Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 3. Admins can manage all profiles (using security definer function)
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (get_current_user_role() = 'admin');

-- 4. Admin clients can view profiles in their client (using security definer function)
CREATE POLICY "Admin clients can view their client profiles" ON public.profiles
FOR SELECT USING (
  get_current_user_role() = 'admin_client' 
  AND get_current_user_client_id() = id_client
);

-- 5. Admin clients can manage users in their client (using security definer function)
CREATE POLICY "Admin clients can manage their client users" ON public.profiles
FOR ALL USING (
  get_current_user_role() = 'admin' 
  OR (
    get_current_user_role() = 'admin_client' 
    AND get_current_user_client_id() = id_client
  )
);