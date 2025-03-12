
import { useState, useEffect } from "react";
import { Client } from "@/pages/Clients";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('clients').select('*');
      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      if (data) {
        const mappedClients: Client[] = data.map(client => ({
          id: client.id,
          nom: client.nom,
          email: client.email,
          secteur_activite: client.secteur_activite,
          contact_principal: client.contact_principal,
          telephone: client.telephone,
          created_at: client.created_at,
          updated_at: client.updated_at,
          entreprise: client.secteur_activite,
          notes: client.contact_principal
        }));
        setClients(mappedClients);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      toast.error("Impossible de récupérer les clients.");
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Client) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          nom: client.nom,
          email: client.email,
          telephone: client.telephone,
          secteur_activite: client.entreprise,
          contact_principal: client.notes
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        const newClient: Client = {
          id: data[0].id,
          nom: data[0].nom,
          email: data[0].email,
          telephone: data[0].telephone,
          entreprise: data[0].secteur_activite,
          notes: data[0].contact_principal,
          secteur_activite: data[0].secteur_activite,
          contact_principal: data[0].contact_principal,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        };
        setClients([...clients, newClient]);
        toast.success(`${client.nom} a été ajouté avec succès.`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors de l'ajout du client:", error);
      toast.error("Impossible d'ajouter le client.");
      return false;
    }
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

      if (error) throw error;

      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? { ...client, updated_at: new Date().toISOString() } : c
        )
      );
      
      toast.success(`${client.nom} a été mis à jour avec succès.`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      toast.error("Impossible de mettre à jour le client.");
      return false;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id_client', clientId);
        
      if (profilesError) throw profilesError;
      
      if (profilesData && profilesData.length > 0) {
        return {
          success: false,
          error: `Impossible de supprimer ce client car ${profilesData.length} utilisateur(s) y sont associés.`
        };
      }
      
      const { data: projetsData, error: projetsError } = await supabase
        .from('projets')
        .select('id')
        .eq('id_client', clientId);
        
      if (projetsError) throw projetsError;
      
      if (projetsData && projetsData.length > 0) {
        return {
          success: false,
          error: `Impossible de supprimer ce client car ${projetsData.length} projet(s) y sont associés.`
        };
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
        
      if (error) throw error;
      
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
      toast.success("Le client a été supprimé avec succès.");
      return { success: true };
      
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      return {
        success: false,
        error: "Impossible de supprimer le client."
      };
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
  };
};
