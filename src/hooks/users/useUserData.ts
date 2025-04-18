
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

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          id_client,
          clients(nom)
        `);
      
      if (isAdmin) {
        if (selectedClientId) {
          query = query.eq('id_client', selectedClientId);
        }
      } else {
        if (userClientId) {
          query = query.eq('id_client', userClientId);
        }
      }
      
      if (selectedRole) {
        query = query.eq('role', selectedRole);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des utilisateurs",
          variant: "destructive"
        });
        return;
      }
      
      // Transform database records into User objects
      const formattedUsers: User[] = data.map(record => ({
        id: record.id,
        email: record.email,
        firstName: record.first_name,
        lastName: record.last_name,
        fullName: record.first_name && record.last_name ? 
          `${record.first_name} ${record.last_name}` : null,
        avatarUrl: null,
        role: record.role,
        clientId: record.id_client,
        createdAt: "", // These fields are not available in the query
        updatedAt: "",
        // For backward compatibility
        first_name: record.first_name,
        last_name: record.last_name,
        id_client: record.id_client,
        client_name: record.clients ? record.clients.nom : null
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
