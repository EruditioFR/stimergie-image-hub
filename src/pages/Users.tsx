import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { UsersHeader } from "@/components/users/UsersHeader";
import { UsersList } from "@/components/users/UsersList";
import { UserForm } from "@/components/users/UserForm";
import { Header } from "@/components/ui/layout/Header";
import { UserGreetingBar } from "@/components/ui/UserGreetingBar";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type User = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  id_client: string | null;
  client_name?: string;
};

export type Client = {
  id: string;
  nom: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
    
    fetchUsers();
    fetchClients();
  }, [selectedClientId, selectedRole, userClientId, isAdmin, uiToast]);

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        email: userData.email,
        password: Math.random().toString(36).slice(-8),
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
      
      setShowAddForm(false);
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la création de l'utilisateur");
    }
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setShowEditForm(true);
  };

  const handleUpdateUser = async (userData: User) => {
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
        return;
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
      setShowEditForm(false);
      setCurrentUser(null);
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la mise à jour de l'utilisateur");
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq('id', userToDelete);

      if (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        toast.error("Impossible de supprimer l'utilisateur");
        return;
      }

      setUsers(prev => prev.filter(user => user.id !== userToDelete));
      toast.success("L'utilisateur a été supprimé avec succès");
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue lors de la suppression de l'utilisateur");
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const roles = [
    { value: "user", label: "Utilisateur" },
    { value: "admin_client", label: "Admin Client" },
    { value: "admin", label: "Administrateur" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <UserGreetingBar />
      <Header />
      
      <UsersHeader onAddClick={() => setShowAddForm(true)} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {showAddForm && (
          <UserForm 
            clients={clients}
            onSubmit={handleAddUser}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {showEditForm && currentUser && (
          <UserForm 
            clients={clients}
            initialData={currentUser}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setShowEditForm(false);
              setCurrentUser(null);
            }}
            isEditing
          />
        )}
        
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {canSeeClientFilter && (
            <div>
              <label htmlFor="client-filter" className="block text-sm font-medium mb-2">
                Filtrer par client
              </label>
              <select
                id="client-filter"
                className="w-full rounded-md border border-input px-3 py-2"
                value={selectedClientId || ""}
                onChange={(e) => setSelectedClientId(e.target.value || null)}
                disabled={!isAdmin && isAdminClient}
              >
                <option value="">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium mb-2">
              Filtrer par rôle
            </label>
            <select
              id="role-filter"
              className="w-full rounded-md border border-input px-3 py-2"
              value={selectedRole || ""}
              onChange={(e) => setSelectedRole(e.target.value || null)}
            >
              <option value="">Tous les rôles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <UsersList 
          users={users} 
          loading={loading} 
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'utilisateur sera supprimé de façon permanente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
