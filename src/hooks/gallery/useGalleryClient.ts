
import { useCallback, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryClient = (user: User | null, userRole: string) => {
  const [userClientId, setUserClientId] = useState<string | null>(user?.user_metadata?.client_id || null);
  
  // Fetch the client ID from profiles if it's not in metadata
  useEffect(() => {
    if (user && userRole === 'user' && !userClientId) {
      const fetchUserClientId = async () => {
        try {
          const { data, error } = await supabase.rpc('get_user_client_id', {
            user_id: user.id
          });
          
          if (error) {
            console.error("Error fetching user client ID:", error);
            return;
          }
          
          if (data) {
            setUserClientId(data);
            console.log("Fetched user client ID:", data);
          }
        } catch (error) {
          console.error("Unexpected error fetching client ID:", error);
        }
      };
      
      fetchUserClientId();
    }
  }, [user, userRole, userClientId]);
  
  const enforceClientForNonAdmin = useCallback(() => {
    // This function will be called in the useGalleryInitialization hook
    // It will set the client filter for non-admin users
    if (userRole === 'user' && userClientId) {
      console.log('Enforcing client filter for user role with client ID:', userClientId);
      return userClientId;
    }
    return null;
  }, [userRole, userClientId]);
  
  const canChangeClient = useCallback(() => {
    // Only admin users can change the client filter
    return userRole === 'admin';
  }, [userRole]);
  
  return {
    userClientId,
    enforceClientForNonAdmin,
    canChangeClient
  };
};
