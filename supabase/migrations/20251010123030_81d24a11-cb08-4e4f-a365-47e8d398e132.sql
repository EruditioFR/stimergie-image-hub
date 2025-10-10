-- Add 'about' to the allowed page_type values in legal_pages table

-- First, drop the existing check constraint
ALTER TABLE public.legal_pages DROP CONSTRAINT IF EXISTS legal_pages_page_type_check;

-- Recreate the check constraint with 'about' included
ALTER TABLE public.legal_pages 
ADD CONSTRAINT legal_pages_page_type_check 
CHECK (page_type IN ('privacy_policy', 'terms_of_service', 'licenses', 'about'));