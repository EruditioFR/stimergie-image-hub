
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryClient = (user: any | null, userRole: string) => {
  const [userClientId, setUserClientId] = useState<string | null>(null);
  const userClientFetchedRef = useRef(false);

  // Récupérer le client_id de l'utilisateur une seule fois
  useEffect(() => {
    const fetchUserClientId = async () => {
      if (!user || userClientFetchedRef.current) return;
      
      const cachedClientId = sessionStorage.getItem(`userClientId-${user.id}`);
      if (cachedClientId) {
        setUserClientId(cachedClientId);
        console.log('Using cached user client ID:', cachedClientId);
        userClientFetchedRef.current = true;
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('get_user_client_id', {
          user_id: user.id
        });
        
        if (error) {
          console.error('Error fetching user client ID:', error);
          return;
        }
        
        if (data) {
          sessionStorage.setItem(`userClientId-${user.id}`, data);
          setUserClientId(data);
          console.log('User client ID fetched and cached:', data);
          userClientFetchedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching user client ID:', error);
      }
    };
    
    fetchUserClientId();
  }, [user]);

  // Forcer le client ID pour les utilisateurs non-admin
  const enforceClientForNonAdmin = useCallback((
    selectedClient: string | null, 
    baseHandleClientChange: (clientId: string | null) => void
  ) => {
    if (['admin_client', 'user'].includes(userRole) && userClientId && selectedClient !== userClientId) {
      console.log('Setting client filter to non-admin user client ID:', userClientId);
      baseHandleClientChange(userClientId);
      return true;
    }
    return false;
  }, [userRole, userClientId]);

  // Vérifie si un utilisateur a le droit de changer de client
  const canChangeClient = useCallback(() => {
    return !(['admin_client', 'user'].includes(userRole) && userClientId);
  }, [userRole, userClientId]);

  return {
    userClientId,
    enforceClientForNonAdmin,
    canChangeClient
  };
};
