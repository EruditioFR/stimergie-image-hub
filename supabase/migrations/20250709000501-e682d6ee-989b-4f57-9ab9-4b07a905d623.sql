
-- Créer la table pour gérer les périodes d'accès aux projets
CREATE TABLE public.project_access_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  access_start TIMESTAMP WITH TIME ZONE NOT NULL,
  access_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contraintes pour éviter les périodes qui se chevauchent pour le même projet
  CONSTRAINT valid_access_period CHECK (access_end > access_start)
);

-- Activer RLS sur la table des périodes d'accès
ALTER TABLE public.project_access_periods ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent tout voir et modifier
CREATE POLICY "Admins can manage all access periods" 
ON public.project_access_periods 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour que les admin_client puissent voir leurs propres périodes d'accès
CREATE POLICY "Admin clients can view their access periods" 
ON public.project_access_periods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_client' 
    AND id_client = project_access_periods.client_id
  )
);

-- Fonction pour vérifier si un utilisateur a accès à un projet à un moment donné
CREATE OR REPLACE FUNCTION public.check_project_access(
  user_id UUID,
  project_id UUID,
  check_time TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_client_id UUID;
  has_access BOOLEAN := false;
BEGIN
  -- Récupérer le rôle et l'ID client de l'utilisateur
  SELECT role, id_client INTO user_role, user_client_id
  FROM public.profiles
  WHERE id = user_id;
  
  -- Les admins ont toujours accès
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Pour les autres rôles, vérifier les périodes d'accès
  IF user_role IN ('admin_client', 'user') AND user_client_id IS NOT NULL THEN
    -- Vérifier s'il existe une période d'accès active pour ce projet et ce client
    SELECT EXISTS(
      SELECT 1 
      FROM public.project_access_periods pap
      JOIN public.projets p ON p.id = pap.project_id
      WHERE pap.project_id = check_project_access.project_id
      AND pap.client_id = user_client_id
      AND pap.is_active = true
      AND check_time >= pap.access_start
      AND check_time <= pap.access_end
    ) INTO has_access;
    
    RETURN has_access;
  END IF;
  
  -- Par défaut, pas d'accès
  RETURN false;
END;
$$;

-- Fonction pour obtenir les projets accessibles par un utilisateur
CREATE OR REPLACE FUNCTION public.get_accessible_projects(
  user_id UUID,
  check_time TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE(project_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_client_id UUID;
BEGIN
  -- Récupérer le rôle et l'ID client de l'utilisateur
  SELECT role, id_client INTO user_role, user_client_id
  FROM public.profiles
  WHERE id = user_id;
  
  -- Les admins ont accès à tous les projets
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id
    FROM public.projets p;
    RETURN;
  END IF;
  
  -- Pour les autres rôles, retourner les projets avec accès actif
  IF user_role IN ('admin_client', 'user') AND user_client_id IS NOT NULL THEN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM public.projets p
    JOIN public.project_access_periods pap ON p.id = pap.project_id
    WHERE pap.client_id = user_client_id
    AND pap.is_active = true
    AND check_time >= pap.access_start
    AND check_time <= pap.access_end;
    RETURN;
  END IF;
  
  -- Par défaut, aucun projet accessible
  RETURN;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_project_access_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_access_periods_updated_at
  BEFORE UPDATE ON public.project_access_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_access_periods_updated_at();

-- Index pour optimiser les requêtes d'accès
CREATE INDEX idx_project_access_periods_active_period 
ON public.project_access_periods(project_id, client_id, access_start, access_end) 
WHERE is_active = true;

CREATE INDEX idx_project_access_periods_client_active 
ON public.project_access_periods(client_id, is_active);
