
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

      const trimmedEmail = userData.email.trim();
      const trimmedPassword = password.trim();

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
      const clientIds = userData.clientIds || (userData.id_client ? [userData.id_client] : null);

      console.log("Calling admin-create-user function with email and user data");

      const SUPABASE_URL = "https://mjhbugzaqmtfnbxaqpss.supabase.co";
      const functionUrl = `${SUPABASE_URL}/functions/v1/admin-create-user`;
      
      console.log("Calling edge function at URL:", functionUrl);

      const response = await fetch(functionUrl, {
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
          clientIds
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from server:", errorText);
        
        let errorMessage = "Erreur lors de la création de l'utilisateur";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText.includes("<") ? 
            "Erreur de serveur lors de la création de l'utilisateur" : 
            errorText || errorMessage;
        }
        
        toast.error(errorMessage);
        return false;
      }
      
      const result = await response.json();
      
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
          const formattedUser: User = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            fullName: newUser.first_name && newUser.last_name ? 
              `${newUser.first_name} ${newUser.last_name}` : null,
            avatarUrl: null,
            role: newUser.role,
            clientIds: newUser.id_client ? [newUser.id_client] : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
      const firstName = userData.firstName || userData.first_name;
      const lastName = userData.lastName || userData.last_name;
      const clientIds = userData.clientIds || (userData.id_client ? [userData.id_client] : null);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          role: userData.role,
          id_client: clientIds && clientIds.length > 0 ? clientIds[0] : null,
          client_ids: clientIds
        })
        .eq('id', userData.id);

      if (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        toast.error("Impossible de mettre à jour l'utilisateur");
        return false;
      }

      if (password && password.trim() !== '') {
        console.log("Updating password for user:", userData.id);
        
        try {
          const SUPABASE_URL = "https://mjhbugzaqmtfnbxaqpss.supabase.co";
          const functionUrl = `${SUPABASE_URL}/functions/v1/admin-update-password`;
          
          const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              userId: userData.id,
              newPassword: password
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from password update:", errorText);
            
            let errorMessage = "Erreur lors de la mise à jour du mot de passe";
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage = errorText.includes("<") ? 
                "Erreur de serveur lors de la mise à jour du mot de passe" : 
                errorText || errorMessage;
            }
            
            toast.error(errorMessage);
            return false;
          }
          
          const result = await response.json();
          console.log("Password updated successfully:", result);
          
        } catch (passwordUpdateError) {
          console.error("Erreur lors de la mise à jour du mot de passe:", passwordUpdateError);
          toast.error("Impossible de mettre à jour le mot de passe");
          return false;
        }
      }

      setUsers(prev => prev.map(user => 
        user.id === userData.id 
          ? {
              ...user,
              firstName: firstName,
              lastName: lastName,
              fullName: firstName && lastName ? `${firstName} ${lastName}` : null,
              role: userData.role,
              clientIds: clientIds,
              updatedAt: new Date().toISOString(),
              first_name: firstName,
              last_name: lastName,
              id_client: clientIds && clientIds.length > 0 ? clientIds[0] : null,
              client_ids: clientIds,
              client_name: clientIds && clientIds.length > 0 ? clients.find(c => c.id === clientIds[0])?.nom || null : null
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
      
      let success = true;
      
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          userToDelete
        );

        if (authError) {
          console.log("Remarque: L'utilisateur n'existe peut-être pas dans auth.users:", authError.message);
          
          if (authError.message !== "User not found" && authError.code !== "user_not_found") {
            success = false;
            toast.error("Note: " + authError.message);
          }
        }
      } catch (err) {
        console.log("Erreur lors de la suppression de l'utilisateur dans auth:", err);
      }
      
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq('id', userToDelete);

      if (profileError) {
        console.error("Erreur lors de la suppression du profil:", profileError);
        toast.error("Impossible de supprimer le profil utilisateur: " + profileError.message);
        success = false;
      }

      if (success || (!success && !profileError)) {
        setUsers(prev => prev.filter(user => user.id !== userToDelete));
        setShowDeleteDialog(false);
        setUserToDelete(null);
        return true;
      } else {
        return false;
      }
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
