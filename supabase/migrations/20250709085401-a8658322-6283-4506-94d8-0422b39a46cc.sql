
-- Supprimer tous les téléchargements avec le statut "pending" (En cours de préparation)
DELETE FROM public.download_requests 
WHERE status = 'pending';

-- Supprimer tous les téléchargements avec le statut "failed" (Échec)
DELETE FROM public.download_requests 
WHERE status = 'failed';
