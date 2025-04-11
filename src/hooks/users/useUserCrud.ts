import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Client } from "@/types/user";

export function useUserCrud(setUsers: React.Dispatch<React.SetStateAction<User[]>>, clients: Client[]) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleAddUser = async (userData: Omit<User, 'id'>, password?: string) => {
    try {
      if (!password) {
        toast.error("Un mot de passe est requis pour créer un utilisateur");
        return false;
      }

      console.log("Creating user with email:", userData.email);

      // Make sure email and password are properly trimmed
      const trimmedEmail = userData.email.trim();
      const trimmedPassword = password.trim();

      // Validate password and email
      if (trimmedPassword.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères");
        return false;
      }

      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        toast.error("Veuillez fournir une adresse email valide");
        return false;
      }

      const firstName = userData.firstName || userData.first_name || '';
      const lastName = userData.lastName || userData.last_name || '';
      const clientId = userData.clientId || userData.id_client || null;

      console.log("Calling admin-create-user function with email and user data");

      // Call our new edge function to create the user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
          firstName,
          lastName,
          role: userData.role || 'user',
          clientId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Erreur lors de la création de l'utilisateur:", result.error);
        
        // More user-friendly error messages
        if (result.error.includes("User with this email already exists")) {
          toast.error("Un utilisateur avec cet email existe déjà");
        } else if (result.error.includes("duplicate key")) {
          toast.error("Un utilisateur avec cet email existe déjà");
        } else if (result.error.includes("permission denied")) {
          toast.error("Vous n'avez pas les permissions nécessaires pour créer un utilisateur");
        } else {
          toast.error(result.error || "Erreur lors de la création de l'utilisateur");
        }
        
        return false;
      }
      
      // Fetch the new user to get all details
      if (result.id) {
        console.log("New user created with ID:", result.id);
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
          .eq('id', result.id)
          .single();
          
        if (fetchError) {
          console.error("Erreur lors de la récupération du nouvel utilisateur:", fetchError);
          toast.warning("Utilisateur créé, mais erreur lors de la récupération des détails");
        } else if (newUser) {
          // Convert DB record to User type
          const formattedUser: User = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            fullName: newUser.first_name && newUser.last_name ? 
              `${newUser.first_name} ${newUser.last_name}` : null,
            avatarUrl: null,
            role: newUser.role,
            clientId: newUser.id_client,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // For backward compatibility
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            id_client: newUser.id_client,
            client_name: newUser.clients ? newUser.clients.nom : null
          };
          
          setUsers(prev => [...prev, formattedUser]);
          
          toast.success("L'utilisateur a été créé avec succès");
          console.log("User added successfully:", newUser);
        }
      }
      
      return true;
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la création de l'utilisateur");
      return false;
    }
  };

  const handleUpdateUser = async (userData: User, password?: string) => {
    try {
      // Get first_name, last_name values from either the new or old field names
      const firstName = userData.firstName || userData.first_name;
      const lastName = userData.lastName || userData.last_name;
      const clientId = userData.clientId || userData.id_client;
      
      // Update profile data first
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          role: userData.role,
          id_client: clientId
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
        
        // Use the Supabase admin API to update password with type assertion
        const { error: passwordError } = await supabase.rpc(
          'admin_update_user_password' as any, 
          {
            user_id: userData.id,
            new_password: password
          }
        );

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
              ...user,
              firstName: firstName,
              lastName: lastName,
              fullName: firstName && lastName ? `${firstName} ${lastName}` : null,
              role: userData.role,
              clientId: clientId,
              updatedAt: new Date().toISOString(),
              // For backward compatibility
              first_name: firstName,
              last_name: lastName,
              id_client: clientId,
              client_name: clients.find(c => c.id === clientId)?.nom || null
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
      
      // Use the RPC function to delete user with proper permissions using type assertion
      const { error } = await supabase.rpc(
        'admin_delete_user' as any, 
        {
          user_id: userToDelete
        }
      );

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
