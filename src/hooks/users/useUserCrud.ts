
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@/types/user";

export function useUserCrud(setUsers: React.Dispatch<React.SetStateAction<User[]>>, clients: { id: string; nom: string }[]) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleAddUser = async (userData: Omit<User, 'id'>, password?: string) => {
    try {
      if (!password) {
        toast.error("Un mot de passe est requis pour créer un utilisateur");
        return false;
      }

      console.log("Creating user with data:", {
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        clientId: userData.id_client
      });

      // Make sure email and password are properly trimmed
      const trimmedEmail = userData.email.trim();
      const trimmedPassword = password.trim();

      // Use RPC function with improved error handling
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        email: trimmedEmail,
        password: trimmedPassword,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role,
        company_id: userData.id_client
      });
      
      if (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        toast.error(error.message);
        return false;
      }
      
      // Fetch the new user
      if (data) {
        console.log("New user created with ID:", data);
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
        } else if (newUser) {
          setUsers(prev => [...prev, {
            ...newUser,
            client_name: newUser.clients ? newUser.clients.nom : null
          }]);
        }
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
      // Update profile data first
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

      // Only attempt password update if a password was provided
      if (password && password.trim() !== '') {
        console.log("Updating password for user:", userData.id);
        
        // Use the Supabase admin API to update password
        const { error: passwordError } = await supabase.rpc('admin_update_user_password', {
          user_id: userData.id,
          new_password: password
        });

        if (passwordError) {
          console.error("Erreur lors de la mise à jour du mot de passe:", passwordError);
          toast.error("Impossible de mettre à jour le mot de passe");
          return false;
        }
        
        console.log("Password updated successfully");
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
      console.log("Deleting user with ID:", userToDelete);
      
      // Use admin function to delete the user from auth.users which will cascade to profiles
      const { error } = await supabase.rpc('admin_delete_user', {
        user_id: userToDelete
      });

      if (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        toast.error("Impossible de supprimer l'utilisateur: " + error.message);
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
    showDeleteDialog,
    userToDelete,
    setShowDeleteDialog,
    setUserToDelete,
    handleAddUser,
    handleUpdateUser,
    confirmDeleteUser
  };
}
