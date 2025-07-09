
-- 1. Activer RLS sur la table projets et créer les politiques d'accès
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent tout voir et modifier
CREATE POLICY "Admins can manage all projects" 
ON public.projets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour que les admin_client puissent voir leurs projets
CREATE POLICY "Admin clients can view their projects" 
ON public.projets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_client' 
    AND id_client = projets.id_client
  )
);

-- Politique pour que les utilisateurs puissent voir les projets auxquels ils ont accès
CREATE POLICY "Users can view accessible projects" 
ON public.projets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND (
      p.role = 'admin' 
      OR (
        p.role IN ('admin_client', 'user') 
        AND EXISTS (
          SELECT 1 FROM public.project_access_periods pap
          WHERE pap.project_id = projets.id
          AND pap.client_id = p.id_client
          AND pap.is_active = true
          AND now() >= pap.access_start
          AND now() <= pap.access_end
        )
      )
    )
  )
);

-- 2. Créer des périodes d'accès pour tous les projets existants qui n'en ont pas
INSERT INTO public.project_access_periods (
  project_id,
  client_id,
  access_start,
  access_end,
  is_active,
  created_by
)
SELECT 
  p.id as project_id,
  p.id_client as client_id,
  '2025-01-01 00:00:00+00'::timestamp with time zone as access_start,
  '2030-12-31 23:59:59+00'::timestamp with time zone as access_end,
  true as is_active,
  null as created_by
FROM public.projets p
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.project_access_periods pap 
  WHERE pap.project_id = p.id 
  AND pap.client_id = p.id_client
);

-- 3. Vérifier et recréer le trigger pour la création automatique des périodes d'accès
DROP TRIGGER IF EXISTS after_project_insert ON public.projets;

CREATE OR REPLACE FUNCTION public.create_default_access_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer une période d'accès par défaut pour le nouveau projet
  INSERT INTO public.project_access_periods (
    project_id,
    client_id,
    access_start,
    access_end,
    is_active,
    created_by
  ) VALUES (
    NEW.id,
    NEW.id_client,
    '2025-01-01 00:00:00+00'::timestamp with time zone,
    '2030-12-31 23:59:59+00'::timestamp with time zone,
    true,
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui se déclenche après l'insertion d'un nouveau projet
CREATE TRIGGER after_project_insert
  AFTER INSERT ON public.projets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_access_period();
