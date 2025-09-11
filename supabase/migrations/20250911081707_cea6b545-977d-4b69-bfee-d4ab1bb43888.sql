-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create policy for admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policy for admin clients to view profiles of their client
CREATE POLICY "Admin clients can view their client profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin_client'
    AND admin_profile.id_client = profiles.id_client
  )
);