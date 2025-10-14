
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
      const clientId = userData.clientId || userData.id_client || null;

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
          clientId
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
            clientId: newUser.id_client,
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
      console.log("Mise à jour de l'utilisateur via Edge Function:", userData);

      const SUPABASE_URL = "https://mjhbugzaqmtfnbxaqpss.supabase.co";
      const functionUrl = `${SUPABASE_URL}/functions/v1/admin-update-user`;
      
      // Call the admin-update-user Edge Function
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: userData.id,
          userData: {
            email: userData.email,
            firstName: userData.first_name || userData.firstName,
            lastName: userData.last_name || userData.lastName,
            clientId: userData.id_client || userData.clientId,
            role: userData.role
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from admin-update-user:", errorText);
        
        let errorMessage = "Erreur lors de la mise à jour de l'utilisateur";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText.includes("<") ? 
            "Erreur de serveur lors de la mise à jour" : 
            errorText || errorMessage;
        }
        
        toast.error(errorMessage);
        return false;
      }

      console.log("Profil mis à jour avec succès");

      // Handle password update separately if provided
      if (password && password.trim() !== '') {
        console.log("Updating password for user:", userData.id);
        
        const passwordFunctionUrl = `${SUPABASE_URL}/functions/v1/admin-update-password`;
        
        const passwordResponse = await fetch(passwordFunctionUrl, {
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

        if (!passwordResponse.ok) {
          const errorText = await passwordResponse.text();
          console.error("Error response from password update:", errorText);
          toast.error("Le profil a été mis à jour mais le mot de passe n'a pas pu être changé");
        } else {
          console.log("Mot de passe mis à jour avec succès");
        }
      }

      // Update local state
      const firstName = userData.firstName || userData.first_name;
      const lastName = userData.lastName || userData.last_name;
      const clientId = userData.clientId || userData.id_client;
      
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
