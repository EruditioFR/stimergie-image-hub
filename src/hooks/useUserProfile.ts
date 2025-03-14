
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
          // Essayer d'utiliser une requête paramétrée pour éviter la récursion RLS
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role, id_client')
            .filter('id', 'eq', user.id)
            .maybeSingle();
            
          if (data && !error) {
            console.log("Profil récupéré avec succès:", data);
            setUserProfile({
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              role: data.role || 'utilisateur',
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
          // Fallback en cas d'erreur
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
