-- Mise à jour des politiques RLS pour supporter le multi-clients

-- 1. Mettre à jour les politiques RLS pour la table clients
DROP POLICY IF EXISTS "Admin clients can view their own client" ON public.clients;
CREATE POLICY "Admin clients can view their clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (public.has_role(auth.uid(), 'admin_client'::app_role)
      AND id = ANY(public.get_user_client_ids(auth.uid())))
);

DROP POLICY IF EXISTS "Users can view their own client" ON public.clients;
CREATE POLICY "Users can view their clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  id = ANY(public.get_user_client_ids(auth.uid()))
);

-- 2. Mettre à jour les politiques RLS pour la table projets
DROP POLICY IF EXISTS "Admin clients can view their projects" ON public.projets;
CREATE POLICY "Admin clients can view their projects (multi-client)"
ON public.projets
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_client'::app_role)
  AND id_client = ANY(public.get_user_client_ids(auth.uid()))
);