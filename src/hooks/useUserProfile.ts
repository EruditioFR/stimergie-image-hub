
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
  clientId: string | null;
  clientName: string | null;
}

interface UserProfileData {
  first_name: string | null;
  last_name: string | null;
  role: string;
  id_client: string | null;
}

export function useUserProfile(user: User | null, userRole: string) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        try {
          setLoading(true);
          setError(null);
          console.log("Fetching profile data for user:", user.id);
          
          // Initialize with data from user metadata first
          const metadataProfile: UserProfile = {
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            role: userRole || 'user',
            clientId: user.user_metadata?.id_client || null,
            clientName: null
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
              // Don't set error state here as we already have fallback profile data
              return;
            }
            
            if (data && data.length > 0) {
              // The function returns a table, so we get an array where the first element is our row
              const profileData = data[0] as UserProfileData;
              console.log("Profile data retrieved from database:", profileData);
              
              // Fetch client name if clientId exists
              let clientName: string | null = null;
              if (profileData.id_client) {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('nom')
                  .eq('id', profileData.id_client)
                  .single();
                
                clientName = clientData?.nom || null;
              }
              
              setUserProfile({
                firstName: profileData.first_name || metadataProfile.firstName,
                lastName: profileData.last_name || metadataProfile.lastName,
                role: profileData.role || metadataProfile.role,
                clientId: profileData.id_client || metadataProfile.clientId,
                clientName: clientName
              });
            }
          } catch (profileError) {
            console.error("Error in profile data fetch:", profileError);
            setError(profileError instanceof Error ? profileError : new Error('Failed to fetch profile data'));
            // Already set fallback profile from metadata
          }
        } catch (err) {
          console.error('Unexpected error in useUserProfile:', err);
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          // Keep the fallback in place
        } finally {
          setLoading(false);
        }
      };
      
      fetchProfileData();
    } else {
      // Clear profile when user is null
      setUserProfile(null);
    }
  }, [user, userRole]);

  return { userProfile, error, loading };
}

export function formatRole(role: string, clientName?: string | null): string {
  // Convert API role names to user-friendly display names
  switch(role?.toLowerCase() || 'user') {
    case 'admin': return 'Administrateur';
    case 'admin_client': 
      return clientName 
        ? `Administrateur Client - ${clientName}` 
        : 'Administrateur Client';
    case 'user': return 'Utilisateur';
    default: return role || 'Utilisateur';
  }
}
