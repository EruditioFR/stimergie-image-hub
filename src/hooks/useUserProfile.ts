
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
          
          // Initialize with data from user metadata first
          const metadataProfile = {
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            role: userRole || 'user',
            clientId: user.user_metadata?.id_client || null
          };
          
          // Set initial profile data from metadata
          setUserProfile(metadataProfile);
          
          // Then try to get the complete profile data from the database
          try {
            const { data, error } = await supabase.rpc('get_user_profile_data', {
              user_id: user.id
            });
            
            if (error) {
              console.error("Error fetching profile data:", error);
              return;
            }
            
            if (data) {
              console.log("Profile data retrieved from database:", data);
              setUserProfile({
                firstName: data.first_name || metadataProfile.firstName,
                lastName: data.last_name || metadataProfile.lastName,
                role: data.role || metadataProfile.role,
                clientId: data.id_client || metadataProfile.clientId
              });
            }
          } catch (profileError) {
            console.error("Error in profile data fetch:", profileError);
            // Already set fallback profile from metadata
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
  switch(role?.toLowerCase() || 'user') {
    case 'admin': return 'Administrateur';
    case 'admin_client': return 'Admin Client';
    case 'user': return 'Utilisateur';
    default: return role || 'Utilisateur';
  }
}
