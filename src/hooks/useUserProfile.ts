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
          console.log("Fetching profile data for user:", user.id);
          
          // Skip RLS completely by using the user's metadata first
          setUserProfile({
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            role: userRole || 'utilisateur',
            clientId: user.user_metadata?.id_client || null
          });
          
          // Then try to get additional data if available, but don't block on it
          try {
            // Use direct database access without relying on RLS policies
            const { data: profileData } = await supabase.from('profiles')
              .select('first_name, last_name, role, id_client')
              .eq('id', user.id)
              .limit(1)
              .single();
              
            if (profileData) {
              console.log("Profile data retrieved successfully:", profileData);
              setUserProfile({
                firstName: profileData.first_name || user.user_metadata?.first_name || '',
                lastName: profileData.last_name || user.user_metadata?.last_name || '',
                role: profileData.role || userRole || 'utilisateur',
                clientId: profileData.id_client || user.user_metadata?.id_client || null
              });
            }
          } catch (profileError) {
            console.log("Profile fetch failed, using metadata fallback:", profileError);
            // We already set the fallback profile from metadata, so we can ignore this error
          }
        } catch (err) {
          console.error('Unexpected error in useUserProfile:', err);
          // Keep the fallback in place
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
