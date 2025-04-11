
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export function useAdminStatus(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (!error && data === true) {
          setIsAdmin(true);
        }
      } catch {
        // Silently fail
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  return { isAdmin };
}
