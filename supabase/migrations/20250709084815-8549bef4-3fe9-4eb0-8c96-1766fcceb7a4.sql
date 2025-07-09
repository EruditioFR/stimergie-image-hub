
-- Vérifier et créer les politiques RLS pour download_requests
-- D'abord, activer RLS sur la table
ALTER TABLE public.download_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres demandes
CREATE POLICY "Users can view own download requests" ON public.download_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de créer leurs propres demandes
CREATE POLICY "Users can insert own download requests" ON public.download_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres demandes
CREATE POLICY "Users can update own download requests" ON public.download_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour permettre aux admins de voir toutes les demandes
CREATE POLICY "Admins can view all download requests" ON public.download_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
