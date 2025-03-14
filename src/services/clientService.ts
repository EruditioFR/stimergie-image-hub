
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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
    let query = supabase
      .from('clients')
      .select('id, nom')
      .order('nom', { ascending: true });
    
    // Si c'est un admin_client, on filtre pour n'afficher que son propre client
    if (userRole === 'admin_client' && userId) {
      const { data: profileData, error: profileError } = await supabase.rpc(
        'get_user_client_id',
        { user_id: userId }
      );
      
      if (profileError) {
        console.error('Error loading user client ID:', profileError);
        return [];
      }
      
      if (profileData) {
        query = query.eq('id', profileData);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error loading clients:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des clients"
      });
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} clients`);
    return data || [];
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
    const { data, error } = await supabase.rpc(
      'get_user_client_id',
      { user_id: userId }
    );
    
    if (error) {
      console.error('Error getting admin client ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
