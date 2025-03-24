
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch project IDs for a client, with caching
 */
export async function fetchProjectIdsForClient(client: string | null): Promise<string[] | null> {
  if (!client) return null;
  
  const cacheKey = `projectIds-${client}`;
  const cachedProjetIds = sessionStorage.getItem(cacheKey);
  
  if (cachedProjetIds) {
    // Utiliser les IDs de projets mis en cache
    const projetIds = JSON.parse(cachedProjetIds);
    console.log('Using cached project IDs:', projetIds.length);
    return projetIds;
  } else {
    // Récupérer les IDs de projets et les mettre en cache
    const { data: projetData, error: projetError } = await supabase
      .from('projets')
      .select('id')
      .eq('id_client', client);
    
    if (projetError) {
      console.error('Error fetching projets for client:', projetError);
      return null;
    }
    
    if (!projetData || projetData.length === 0) {
      console.log('No projects found for this client');
      // Mettre en cache un tableau vide pour éviter des requêtes répétées
      sessionStorage.setItem(cacheKey, JSON.stringify([]));
      return [];
    }
    
    const projetIds = projetData.map(projet => projet.id);
    console.log('Project IDs for client:', projetIds.length);
    
    // Mettre en cache les IDs de projets
    sessionStorage.setItem(cacheKey, JSON.stringify(projetIds));
    return projetIds;
  }
}
