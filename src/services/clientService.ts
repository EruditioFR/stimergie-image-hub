
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/user";
import { toast } from "@/hooks/use-toast";

/**
 * Charge la liste des clients - sans restrictions RLS
 */
export async function fetchClients(): Promise<Client[]> {
  console.log("Fetching all clients without RLS restrictions");
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, nom')
      .order('nom', { ascending: true });
      
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
 * Récupère l'ID du client associé à un utilisateur
 */
export async function getAdminClientId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id_client')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting admin client ID:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer l'ID client"
      });
      return null;
    }
    
    return data?.id_client || null;
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
