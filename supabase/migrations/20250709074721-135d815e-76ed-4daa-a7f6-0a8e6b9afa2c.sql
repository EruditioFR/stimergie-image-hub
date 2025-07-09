
-- Insérer des périodes d'accès pour tous les projets de tous les clients
-- du 01/01/2025 00:00 au 31/12/2030 23:59, en excluant les combinaisons qui existent déjà
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
