
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UsersHeader } from "@/components/users/UsersHeader";
import { UsersList } from "@/components/users/UsersList";
import { UserForm } from "@/components/users/UserForm";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Charger la liste des utilisateurs
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
        
        if (selectedClientId) {
          query = query.eq('id_client', selectedClientId);
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
        
        // Transformer les données pour inclure le nom du client
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
    
    // Charger la liste des clients pour le filtre
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
  }, [selectedClientId, toast]);

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      // Utiliser la fonction create_user_with_profile de Supabase
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        email: userData.email,
        password: Math.random().toString(36).slice(-8), // Mot de passe temporaire aléatoire
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role,
        company_id: userData.id_client
      });
      
      if (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Récupérer l'utilisateur nouvellement créé
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
        // Ajouter l'utilisateur à la liste
        setUsers(prev => [...prev, {
          ...newUser,
          client_name: newUser.clients ? newUser.clients.nom : null
        }]);
      }
      
      toast({
        title: "Succès",
        description: "L'utilisateur a été créé avec succès"
      });
      
      // Fermer le formulaire
      setShowAddForm(false);
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* En-tête de la page */}
      <UsersHeader onAddClick={() => setShowAddForm(true)} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {/* Formulaire d'ajout (conditionnel) */}
        {showAddForm && (
          <UserForm 
            clients={clients}
            onSubmit={handleAddUser}
            onCancel={() => setShowAddForm(false)}
          />
        )}
        
        {/* Filtre par client */}
        <div className="mb-8">
          <label htmlFor="client-filter" className="block text-sm font-medium mb-2">
            Filtrer par client
          </label>
          <select
            id="client-filter"
            className="w-full max-w-xs rounded-md border border-input px-3 py-2"
            value={selectedClientId || ""}
            onChange={(e) => setSelectedClientId(e.target.value || null)}
          >
            <option value="">Tous les clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
              </option>
            ))}
          </select>
        </div>
        
        {/* Liste des utilisateurs */}
        <UsersList users={users} loading={loading} />
      </main>
    </div>
  );
}
