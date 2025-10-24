-- Add missing foreign keys so PostgREST can resolve nested relationships

-- 1) Ensure projets.id is referenced by images.id_projet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'images_id_projet_fkey'
  ) THEN
    ALTER TABLE public.images
    ADD CONSTRAINT images_id_projet_fkey
    FOREIGN KEY (id_projet)
    REFERENCES public.projets(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

-- 2) Ensure clients.id is referenced by projets.id_client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'projets_id_client_fkey'
  ) THEN
    ALTER TABLE public.projets
    ADD CONSTRAINT projets_id_client_fkey
    FOREIGN KEY (id_client)
    REFERENCES public.clients(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

-- 3) Helpful indexes for performance on join columns (create if missing)
CREATE INDEX IF NOT EXISTS idx_images_id_projet ON public.images(id_projet);
CREATE INDEX IF NOT EXISTS idx_projets_id_client ON public.projets(id_client);
