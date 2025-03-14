
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/user";
import { toast } from "@/hooks/use-toast";

/**
 * Charge la liste des clients en fonction du rôle de l'utilisateur
 * Les admins voient tous les clients
 * Les admin_client ne voient que leur propre client
 */
export async function fetchClients(userRole: string, userId: string | undefined): Promise<Client[]> {
  console.log("Fetching clients with userRole:", userRole, "userId:", userId);
  
  try {
    // Pour les admins, aucun filtre n'est appliqué - ils voient tous les clients
    if (userRole === 'admin') {
      // Utiliser une requête simple sans RLS pour les admins
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom')
        .order('nom', { ascending: true });
        
      if (error) {
        console.error('Error loading clients for admin:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la liste des clients"
        });
        return [];
      }
      
      console.log(`Retrieved ${data?.length || 0} clients for admin`);
      return data || [];
    } 
    // Si c'est un admin_client, on utilise la fonction RPC sécurisée
    else if (userRole === 'admin_client' && userId) {
      // 1. Récupérer l'ID du client associé à l'utilisateur via RPC
      const { data: clientId, error: profileError } = await supabase.rpc(
        'get_user_client_id',
        { user_id: userId }
      );
      
      if (profileError) {
        console.error('Error loading user client ID:', profileError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de récupérer les informations client"
        });
        return [];
      }
      
      if (!clientId) {
        console.log('No client associated with this user');
        return [];
      }
      
      // 2. Récupérer les informations du client
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom')
        .eq('id', clientId)
        .order('nom', { ascending: true });
      
      if (error) {
        console.error('Error loading client:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les informations client"
        });
        return [];
      }
      
      console.log(`Retrieved client data for admin_client`);
      return data || [];
    }
    
    // Pour les autres rôles ou cas, retourner un tableau vide
    return [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    toast({
      variant: "destructive",
      title: "Erreur",
      description: "Une erreur est survenue lors du chargement des clients"
    });
    return [];
  }
}

/**
 * Sélectionne automatiquement le client pour un admin_client
 */
export async function getAdminClientId(userId: string): Promise<string | null> {
  try {
    // Utiliser la fonction RPC sécurisée pour éviter les problèmes de RLS
    const { data, error } = await supabase.rpc(
      'get_user_client_id',
      { user_id: userId }
    );
    
    if (error) {
      console.error('Error getting admin client ID:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer l'ID client"
      });
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
    toast({
      variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération de l'ID client"
    });
    return null;
  }
}
