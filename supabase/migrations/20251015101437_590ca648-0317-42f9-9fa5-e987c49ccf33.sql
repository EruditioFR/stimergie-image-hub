-- Correction 1: Séparer les politiques RLS pour la table clients
-- Objectif: Les admins doivent voir TOUS les clients, pas seulement leurs propres clients

-- Supprimer la politique combinée actuelle
DROP POLICY IF EXISTS "Admin clients can view their clients" ON public.clients;

-- Créer une politique DISTINCTE pour les admins (accès COMPLET)
CREATE POLICY "Admins can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Créer une politique DISTINCTE pour admin_client (accès RESTREINT)
CREATE POLICY "Admin clients can view their own clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_client'::app_role)
  AND id = ANY(public.get_user_client_ids(auth.uid()))
);

-- Note: La politique "Users can view their clients" reste inchangée

-- Correction 2: Corriger le rôle de jbbejot+jbbejot@gmail.com
-- Cet utilisateur doit être un 'user' (utilisateur multi-clients) et non un 'admin'
UPDATE public.user_roles 
SET role = 'user'::app_role
WHERE user_id = 'e34ee4ae-347e-4343-bbdc-839bc475a801';

-- Également mettre à jour son profil pour cohérence
UPDATE public.profiles 
SET role = 'user'
WHERE id = 'e34ee4ae-347e-4343-bbdc-839bc475a801';