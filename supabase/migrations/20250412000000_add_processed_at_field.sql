
-- Ajouter une colonne processed_at pour suivre quand une demande a été traitée
ALTER TABLE public.download_requests
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Ajouter une colonne error_details pour stocker les détails des erreurs
ALTER TABLE public.download_requests
ADD COLUMN IF NOT EXISTS error_details TEXT;

-- S'assurer que le champ status accepte 'processing' et 'failed'
ALTER TABLE public.download_requests
DROP CONSTRAINT IF EXISTS download_requests_status_check;

ALTER TABLE public.download_requests
ADD CONSTRAINT download_requests_status_check
CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'expired'));
