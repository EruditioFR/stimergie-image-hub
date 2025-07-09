
-- Supprimer les politiques existantes qui peuvent entrer en conflit
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projets;
DROP POLICY IF EXISTS "Admin clients can view their projects" ON public.projets;
DROP POLICY IF EXISTS "Users can view accessible projects" ON public.projets;

-- Recréer des politiques simplifiées et non-conflictuelles

-- Politique pour les admins (accès total)
CREATE POLICY "Admins can manage all projects" 
ON public.projets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour les admin_client (leurs projets uniquement)
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

-- Politique spécifique pour les utilisateurs normaux (basée sur les périodes d'accès)
CREATE POLICY "Users can view accessible projects via access periods" 
ON public.projets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'user'
    AND p.id_client IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.project_access_periods pap
      WHERE pap.project_id = projets.id
      AND pap.client_id = p.id_client
      AND pap.is_active = true
      AND now() >= pap.access_start
      AND now() <= pap.access_end
    )
  )
);
