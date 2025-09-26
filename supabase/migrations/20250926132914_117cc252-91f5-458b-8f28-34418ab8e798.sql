-- Enable RLS on tables that have policies but RLS disabled
-- This fixes the "Policy Exists RLS Disabled" error and infinite recursion

-- Enable RLS on profiles table (this is likely causing the infinite recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on any other tables that might have policies but no RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Check and enable RLS on other critical tables
DO $$
BEGIN
    -- Enable RLS on all tables that have policies but RLS is disabled
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'albums' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;