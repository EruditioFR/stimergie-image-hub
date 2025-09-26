-- Enable RLS on all remaining public tables that need it
-- This resolves the "RLS Disabled in Public" security error

-- Enable RLS on all public tables that don't have it yet
ALTER TABLE public.album_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ftp_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_shared_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_erreurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_access_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;

-- No need to enable RLS on profiles and albums again as they were already enabled