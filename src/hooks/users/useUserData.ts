
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Client } from "@/types/user";

export function useUserData(
  selectedClientId: string | null,
  selectedRole: string | null,
  userClientId: string | null,
  isAdmin: boolean
) {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch users using RPC that gets roles from user_roles table
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_users_with_roles', {
        p_filter_client_id: selectedClientId,
        p_filter_role: selectedRole
      });
      
      if (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des utilisateurs",
          variant: "destructive"
        });
        return;
      }
      
      // Transform RPC results into User objects
      const formattedUsers: User[] = (data || []).map(record => ({
        id: record.id,
        email: record.email,
        firstName: record.first_name,
        lastName: record.last_name,
        fullName: record.first_name && record.last_name ? 
          `${record.first_name} ${record.last_name}` : null,
        avatarUrl: null,
        role: record.role,
        clientId: record.id_client,
        createdAt: record.created_at || "",
        updatedAt: record.updated_at || "",
        // For backward compatibility
        first_name: record.first_name,
        last_name: record.last_name,
        id_client: record.id_client,
        client_ids: record.client_ids || [],
        client_name: record.client_name
      }));
      
      setUsers(formattedUsers);
    } catch (err) {
      console.error("Erreur inattendue:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch clients
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("nom");
      
      if (error) {
        console.error("Erreur lors du chargement des clients:", error);
        return;
      }
      
      setClients(data || []);
    } catch (err) {
      console.error("Erreur inattendue:", err);
    }
  };

  // Fetch users and clients when filters change
  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, [selectedClientId, selectedRole, userClientId, isAdmin]);

  return {
    users,
    clients,
    loading,
    setUsers
  };
}
