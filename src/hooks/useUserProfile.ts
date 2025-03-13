
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

export function useUserProfile(user: User | null, userRole: string) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', user.id)
            .single();
            
          if (data && !error) {
            setUserProfile({
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              role: data.role || 'utilisateur'
            });
          } else {
            console.error('Error fetching profile:', error);
            
            // Fallback: use metadata from user object
            setUserProfile({
              firstName: user.user_metadata?.first_name || '',
              lastName: user.user_metadata?.last_name || '',
              role: userRole || 'utilisateur'
            });
          }
        } catch (err) {
          console.error('Unexpected error fetching profile:', err);
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
