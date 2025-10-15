
import { useCallback, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearCorruptedProjectCache } from '@/services/gallery/projectUtils';

export const useGalleryClient = (user: User | null, userRole: string) => {
  const [userClientId, setUserClientId] = useState<string | null>(user?.user_metadata?.client_id || null);
  const [userClientIds, setUserClientIds] = useState<string[]>([]);
  
  // Fetch all client IDs from profiles for non-admin users
  useEffect(() => {
    if (user && ['admin_client', 'user'].includes(userRole)) {
      const fetchUserClientIds = async () => {
        try {
          // Use the new RPC function to get all client IDs
          const { data, error } = await supabase.rpc('get_user_client_ids', {
            user_id: user.id
          });
          
          if (error) {
            console.error("Error fetching user client IDs:", error);
            return;
          }
          
          if (data && data.length > 0) {
            setUserClientIds(data);
            // Set the first client as the default client ID for backward compatibility
            setUserClientId(data[0]);
            console.log("Fetched user client IDs:", data);
            
            // Clear any corrupted project cache for all clients
            data.forEach((clientId: string) => clearCorruptedProjectCache(clientId));
          }
        } catch (error) {
          console.error("Unexpected error fetching client IDs:", error);
        }
      };
      
      fetchUserClientIds();
    }
  }, [user, userRole]);
  
  const enforceClientForNonAdmin = useCallback(() => {
    // This function will be called in the useGalleryInitialization hook
    // For non-admin users with multiple clients, use the first one as default
    if (['admin_client', 'user'].includes(userRole) && userClientId) {
      console.log('Enforcing client filter for non-admin role with client ID:', userClientId);
      console.log('User has access to', userClientIds.length, 'client(s)');
      return userClientId;
    }
    return null;
  }, [userRole, userClientId, userClientIds]);
  
  const canChangeClient = useCallback(() => {
    // Only admin users can change the client filter
    return userRole === 'admin';
  }, [userRole]);
  
  return {
    userClientId,
    userClientIds,
    enforceClientForNonAdmin,
    canChangeClient
  };
};
