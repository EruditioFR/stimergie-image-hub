-- Phase 1.1 : Créer l'enum et la table user_roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin_client', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Phase 1.2 : Créer la fonction has_role() SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Phase 1.3 : Migrer les données existantes de profiles vers user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role 
FROM public.profiles 
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 1.4 : Mettre à jour get_user_role pour lire depuis user_roles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Mettre à jour has_specific_role
CREATE OR REPLACE FUNCTION public.has_specific_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), required_role::app_role)
$$;

-- Phase 2 : Mise à jour des politiques RLS pour utiliser has_role()

-- Table: clients
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
CREATE POLICY "Admins can manage all clients"
ON public.clients
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin clients can view their own client" ON public.clients;
CREATE POLICY "Admin clients can view their own client"
ON public.clients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_client') 
  AND id = get_current_user_client_id()
);

-- Table: projets
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projets;
CREATE POLICY "Admins can manage all projects"
ON public.projets
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin clients can view their projects" ON public.projets;
CREATE POLICY "Admin clients can view their projects"
ON public.projets
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_client')
  AND id_client = get_current_user_client_id()
);

DROP POLICY IF EXISTS "Users can view projects with active access" ON public.projets;
CREATE POLICY "Users can view projects with active access"
ON public.projets
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'admin_client')
    AND id_client = get_current_user_client_id()
  )
  OR EXISTS (
    SELECT 1
    FROM profiles p
    JOIN project_access_periods pap ON pap.client_id = p.id_client
    WHERE p.id = auth.uid()
    AND pap.project_id = projets.id
    AND pap.is_active = true
    AND now() >= pap.access_start
    AND now() <= pap.access_end
  )
);

-- Table: project_access_periods
DROP POLICY IF EXISTS "Admins can manage all access periods" ON public.project_access_periods;
CREATE POLICY "Admins can manage all access periods"
ON public.project_access_periods
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin clients can view their access periods" ON public.project_access_periods;
CREATE POLICY "Admin clients can view their access periods"
ON public.project_access_periods
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_client')
  AND client_id = get_current_user_client_id()
);

-- Table: images
DROP POLICY IF EXISTS "Allow creator or admins to update images" ON public.images;
CREATE POLICY "Allow creator or admins to update images"
ON public.images
FOR UPDATE
USING (
  auth.uid() = created_by 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Allow creator or admins to delete images" ON public.images;
CREATE POLICY "Allow creator or admins to delete images"
ON public.images
FOR DELETE
USING (
  auth.uid() = created_by 
  OR public.has_role(auth.uid(), 'admin')
);

-- Table: image_shared_clients
DROP POLICY IF EXISTS "Admins can manage all image shares" ON public.image_shared_clients;
CREATE POLICY "Admins can manage all image shares"
ON public.image_shared_clients
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin clients can view their shared images" ON public.image_shared_clients;
CREATE POLICY "Admin clients can view their shared images"
ON public.image_shared_clients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_client')
  AND client_id = get_current_user_client_id()
);

DROP POLICY IF EXISTS "Users can view images shared with their client" ON public.image_shared_clients;
CREATE POLICY "Users can view images shared with their client"
ON public.image_shared_clients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'user')
  AND client_id = get_current_user_client_id()
);

-- Table: albums
DROP POLICY IF EXISTS "Users can delete their albums" ON public.albums;
CREATE POLICY "Users can delete their albums"
ON public.albums
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "Users can update their albums" ON public.albums;
CREATE POLICY "Users can update their albums"
ON public.albums
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "Users can view their albums" ON public.albums;
CREATE POLICY "Users can view their albums"
ON public.albums
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR auth.uid() = created_by
  OR auth.email() = ANY(recipients)
);

-- Table: album_images
DROP POLICY IF EXISTS "Admins can manage album images" ON public.album_images;
CREATE POLICY "Admins can manage album images"
ON public.album_images
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Table: ftp_files
DROP POLICY IF EXISTS "Admins can manage all FTP files" ON public.ftp_files;
CREATE POLICY "Admins can manage all FTP files"
ON public.ftp_files
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin clients can view FTP files" ON public.ftp_files;
CREATE POLICY "Admin clients can view FTP files"
ON public.ftp_files
FOR SELECT
USING (public.has_role(auth.uid(), 'admin_client'));

-- Table: download_requests
DROP POLICY IF EXISTS "Admins can view all download requests" ON public.download_requests;
CREATE POLICY "Admins can view all download requests"
ON public.download_requests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Table: logs_erreurs
DROP POLICY IF EXISTS "Admins can manage error logs" ON public.logs_erreurs;
CREATE POLICY "Admins can manage error logs"
ON public.logs_erreurs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Table: legal_pages
DROP POLICY IF EXISTS "Only admins can insert legal pages" ON public.legal_pages;
CREATE POLICY "Only admins can insert legal pages"
ON public.legal_pages
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can update legal pages" ON public.legal_pages;
CREATE POLICY "Only admins can update legal pages"
ON public.legal_pages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Table: blog_posts
DROP POLICY IF EXISTS "Enable update for admins" ON public.blog_posts;
CREATE POLICY "Enable update for admins"
ON public.blog_posts
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'admin_client')
);

-- Créer des politiques RLS pour user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));