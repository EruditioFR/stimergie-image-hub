
-- Créer une fonction pour ajouter automatiquement une période d'accès par défaut
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
