-- Simplify profiles RLS to avoid recursion and unblock reads
-- Drop existing profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can view their client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin clients can manage their client users" ON public.profiles;

-- Allow all authenticated users to read profiles (temporary to break recursion)
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Optionally, allow admins to update any profile via RPC/edge functions (not direct RLS here)