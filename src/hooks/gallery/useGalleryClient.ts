
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';

export const useGalleryClient = (user: User | null, userRole: string) => {
  const userClientId = user?.user_metadata?.client_id || null;
  
  const enforceClientForNonAdmin = useCallback(() => {
    // Logic to enforce client for non-admin users
    console.log('Enforcing client filter for non-admin users');
    // This is an empty implementation as it will be handled in the initialization hook
  }, []);
  
  const canChangeClient = useCallback(() => {
    return userRole === 'admin';
  }, [userRole]);
  
  return {
    userClientId,
    enforceClientForNonAdmin,
    canChangeClient
  };
};
