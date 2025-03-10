
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserGreetingBar } from "@/components/ui/UserGreetingBar";
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

// Update the Client interface to match the Supabase data structure
export interface Client {
  id?: string;
  nom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  notes?: string;
  secteur_activite?: string;
  contact_principal?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const { toast: uiToast } = useToast();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      
      if (data) {
        // Map the Supabase data to our Client interface
        const mappedClients: Client[] = data.map(client => ({
          id: client.id,
          nom: client.nom,
          email: client.email, // Include the email field from database
          secteur_activite: client.secteur_activite,
          contact_principal: client.contact_principal,
          telephone: client.telephone, // Add telephone field that we've now added to the table
          created_at: client.created_at,
          updated_at: client.updated_at,
          // Map database fields to our Client interface fields
          entreprise: client.secteur_activite,
          notes: client.contact_principal
        }));
        
        setClients(mappedClients);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      uiToast({
        title: "Erreur",
        description: "Impossible de récupérer les clients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Client) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          { 
            nom: client.nom,
            email: client.email, // Include email field in the insert
            telephone: client.telephone, // Include telephone field in the insert
            secteur_activite: client.entreprise, // Mapping entreprise à secteur_activite
            contact_principal: client.notes      // Mapping notes à contact_principal
          }
        ])
        .select();
      
      if (error) {
        console.error("Supabase insert error details:", error);
        throw error;
      }
      
      if (data) {
        // Map the returned data to match our Client interface
        const newClient: Client = {
          id: data[0].id,
          nom: data[0].nom,
          email: data[0].email, // Include email from database response
          telephone: data[0].telephone, // Include telephone from database response
          entreprise: data[0].secteur_activite,
          notes: data[0].contact_principal,
          secteur_activite: data[0].secteur_activite,
          contact_principal: data[0].contact_principal,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        };
        
        setClients([...clients, newClient]);
        setShowForm(false);
        toast.success(`${client.nom} a été ajouté avec succès.`);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du client:", error);
      toast.error("Impossible d'ajouter le client.");
    }
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setIsEditing(true);
    setShowForm(true);
  };

  const updateClient = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          nom: client.nom,
          email: client.email,
          telephone: client.telephone,
          secteur_activite: client.entreprise,
          contact_principal: client.notes
        })
        .eq('id', client.id);
      
      if (error) {
        console.error("Supabase update error details:", error);
        throw error;
      }
      
      // Update client in local state
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? {
            ...client,
            updated_at: new Date().toISOString()
          } : c
        )
      );
      
      setShowForm(false);
      setIsEditing(false);
      setCurrentClient(null);
      toast.success(`${client.nom} a été mis à jour avec succès.`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      toast.error("Impossible de mettre à jour le client.");
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete);
      
      if (error) {
        console.error("Supabase delete error details:", error);
        throw error;
      }
      
      // Remove client from local state
      setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete));
      toast.success("Le client a été supprimé avec succès.");
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      toast.error("Impossible de supprimer le client.");
    } finally {
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const handleFormSubmit = (client: Client) => {
    if (isEditing && currentClient) {
      updateClient(client);
    } else {
      addClient(client);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentClient(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <UserGreetingBar />
      <div className="pt-16"> {/* Ajout d'un padding-top pour éviter que le contenu soit caché par le header fixe */}
        <ClientsHeader 
          onAddClick={() => {
            setIsEditing(false);
            setCurrentClient(null);
            setShowForm(true);
          }} 
        />
        <div className="max-w-7xl mx-auto px-6 py-8">
          {showForm ? (
            <ClientForm 
              initialData={isEditing ? currentClient! : undefined}
              onSubmit={handleFormSubmit} 
              onCancel={handleFormCancel} 
            />
          ) : (
            <ClientsList 
              clients={clients} 
              loading={loading} 
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
            />
          )}
        </div>
      </div>
      <Footer />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce client seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
