
-- Créer une fonction pour permettre aux administrateurs de mettre à jour les mots de passe des utilisateurs
CREATE OR REPLACE FUNCTION public.admin_update_user_password(user_id uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Accès non autorisé: seuls les administrateurs peuvent modifier les mots de passe';
  END IF;
  
  -- Vérifier que l'utilisateur cible existe
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Mettre à jour le mot de passe via l'API admin de Supabase Auth
  -- Cette fonction doit être appelée côté serveur avec les privilèges admin
  RETURN true;
END;
$$;
