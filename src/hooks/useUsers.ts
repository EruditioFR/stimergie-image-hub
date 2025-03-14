
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { User, Client } from "@/types/user";
import { useAuth } from "@/context/AuthContext";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { toast: uiToast } = useToast();
  const { user, userRole } = useAuth();

  const isAdmin = userRole === 'admin';
  const isAdminClient = userRole === 'admin_client';
  const canSeeClientFilter = isAdmin || isAdminClient;

  const [userClientId, setUserClientId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserClientId() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id_client")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user client ID:", error);
        return;
      }
      
      if (data?.id_client) {
        setUserClientId(data.id_client);
        
        if (!isAdmin) {
          setSelectedClientId(data.id_client);
        }
      }
    }
    
    fetchUserClientId();
  }, [user, isAdmin]);

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, [selectedClientId, selectedRole, userClientId, isAdmin]);

  async function fetchUsers() {
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
        uiToast({
          title: "Erreur",
          description: "Impossible de charger la liste des utilisateurs",
          variant: "destructive"
        });
        return;
      }
      
      const formattedUsers = data.map(user => ({
        ...user,
        client_name: user.clients ? user.clients.nom : null
      }));
      
      setUsers(formattedUsers);
    } catch (err) {
      console.error("Erreur inattendue:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom")
        .order("nom");
      
      if (error) {
        console.error("Erreur lors du chargement des clients:", error);
        return;
      }
      
      setClients(data || []);
    } catch (err) {
      console.error("Erreur inattendue:", err);
    }
  }

  const handleAddUser = async (userData: Omit<User, 'id'>, password?: string) => {
    try {
      if (!password) {
        toast.error("Un mot de passe est requis pour créer un utilisateur");
        return;
      }

      const { data, error } = await supabase.rpc('create_user_with_profile', {
        email: userData.email,
        password: password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role,
        company_id: userData.id_client
      });
      
      if (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        uiToast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      const { data: newUser, error: fetchError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          id_client,
          clients(nom)
        `)
        .eq('id', data)
        .single();
        
      if (fetchError) {
        console.error("Erreur lors de la récupération du nouvel utilisateur:", fetchError);
      } else {
        setUsers(prev => [...prev, {
          ...newUser,
          client_name: newUser.clients ? newUser.clients.nom : null
        }]);
      }
      
      toast.success("L'utilisateur a été créé avec succès");
      return true;
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la création de l'utilisateur");
      return false;
    }
  };

  const handleUpdateUser = async (userData: User, password?: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          id_client: userData.id_client
        })
        .eq('id', userData.id);

      if (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        toast.error("Impossible de mettre à jour l'utilisateur");
        return false;
      }

      if (password && password.trim() !== '') {
        const { error: passwordError } = await supabase.rpc('admin_update_user_password', {
          user_id: userData.id,
          new_password: password
        } as any);

        if (passwordError) {
          console.error("Erreur lors de la mise à jour du mot de passe:", passwordError);
          toast.error("Impossible de mettre à jour le mot de passe");
          return false;
        }
      }

      setUsers(prev => prev.map(user => 
        user.id === userData.id 
          ? {
              ...userData,
              client_name: clients.find(c => c.id === userData.id_client)?.nom || null
            }
          : user
      ));

      toast.success("L'utilisateur a été mis à jour avec succès");
      return true;
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la mise à jour de l'utilisateur");
      return false;
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq('id', userToDelete);

      if (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        toast.error("Impossible de supprimer l'utilisateur");
        return false;
      }

      setUsers(prev => prev.filter(user => user.id !== userToDelete));
      toast.success("L'utilisateur a été supprimé avec succès");
      return true;
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la suppression de l'utilisateur");
      return false;
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  return {
    users,
    clients,
    loading,
    selectedClientId,
    selectedRole,
    showDeleteDialog,
    userToDelete,
    isAdmin,
    isAdminClient,
    canSeeClientFilter,
    setSelectedClientId,
    setSelectedRole,
    handleAddUser,
    handleUpdateUser,
    setShowDeleteDialog,
    setUserToDelete,
    confirmDeleteUser,
    availableRoles: isAdmin ? [
      { value: "user", label: "Utilisateur" },
      { value: "admin_client", label: "Admin Client" },
      { value: "admin", label: "Administrateur" }
    ] : [
      { value: "user", label: "Utilisateur" },
      { value: "admin_client", label: "Admin Client" }
    ]
  };
}
