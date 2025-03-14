
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
  clientId: string | null;
}

export function useUserProfile(user: User | null, userRole: string) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        try {
          // Use the get_current_user_role RPC function to avoid recursion in RLS policies
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_user_role');
          const role = rpcError ? userRole : rpcData;
          
          // Use a parameterized query instead of .eq() to avoid RLS issues
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, id_client')
            .filter('id', 'eq', user.id)
            .maybeSingle();
          
          if (data && !error) {
            console.log("Profile data retrieved successfully:", data);
            setUserProfile({
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              role: role || 'utilisateur',
              clientId: data.id_client
            });
          } else {
            console.error('Error fetching profile:', error);
            
            // Fallback: use metadata from user object
            setUserProfile({
              firstName: user.user_metadata?.first_name || '',
              lastName: user.user_metadata?.last_name || '',
              role: userRole || 'utilisateur',
              clientId: user.user_metadata?.id_client || null
            });
          }
        } catch (err) {
          console.error('Unexpected error fetching profile:', err);
          // Fallback in case of error
          setUserProfile({
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            role: userRole || 'utilisateur',
            clientId: user.user_metadata?.id_client || null
          });
        }
      };
      
      fetchProfileData();
    }
  }, [user, userRole]);

  return userProfile;
}

export function formatRole(role: string): string {
  // Convert API role names to user-friendly display names
  switch(role.toLowerCase()) {
    case 'admin': return 'Administrateur';
    case 'admin_client': return 'Admin Client';
    case 'user': return 'Utilisateur';
    default: return role;
  }
}
