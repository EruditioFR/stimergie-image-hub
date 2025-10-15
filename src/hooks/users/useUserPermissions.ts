
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useUserPermissions() {
  const { user, userRole } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  const [userClientIds, setUserClientIds] = useState<string[]>([]);

  const isAdmin = userRole === 'admin';
  const isAdminClient = userRole === 'admin_client';
  const canSeeClientFilter = isAdmin || isAdminClient;

  useEffect(() => {
    async function fetchUserClientId() {
      if (!user) return;
      
      try {
        // Use the security definer function to get client ID
        const { data, error } = await supabase.rpc(
          'get_user_client_id', 
          { user_id: user.id }
        );
        
        if (error) {
          console.error("Error fetching user client ID:", error);
          return;
        }
        
        if (data) {
          setUserClientId(data);
        }

        // Fetch client_ids array for multi-client support
        const { data: profileData } = await supabase
          .from('profiles')
          .select('client_ids')
          .eq('id', user.id)
          .maybeSingle();
        
        // Build the complete list of client IDs
        if (profileData?.client_ids && profileData.client_ids.length > 0) {
          setUserClientIds(profileData.client_ids);
        } else if (data) {
          // Fallback to single client ID
          setUserClientIds([data]);
        }
      } catch (err) {
        console.error("Unexpected error when fetching client ID:", err);
      }
    }
    
    fetchUserClientId();
  }, [user]);

  return {
    userClientId,
    userClientIds,
    isAdmin,
    isAdminClient,
    canSeeClientFilter,
    availableRoles: isAdmin ? [
      { value: "user", label: "Utilisateur" },
      { value: "admin_client", label: "Admin Client" },
      { value: "admin", label: "Administrateur" }
    ] : [
      { value: "user", label: "Utilisateur" }
      // Admin client ne peut créer que des "user"
    ]
  };
}
