
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectIdsForClient } from "./projectUtils";

/**
 * Fetch total count of images matching filter criteria
 */
export async function fetchTotalImagesCount(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null,
  project: string | null,
  orientation: string | null,
  userRole: string,
  userClientId: string | null
): Promise<number> {
  try {
    // Pour admin_client et utilisateurs normaux, toujours filtrer par leur client ID
    if (['admin_client', 'user'].includes(userRole) && userClientId) {
      console.log('Non-admin user detected, forcing client filter in count even with tag filter:', userClientId);
      client = userClientId;
    }
    
    let query = supabase.from('images').select('*', { count: 'exact', head: true });
    
    // Obtenir et appliquer les IDs de projets si un client est sélectionné
    if (client) {
      const projetIds = await fetchProjectIdsForClient(client);
      
      if (projetIds && projetIds.length > 0) {
        query = query.in('id_projet', projetIds);
      } else {
        return 0; // Aucun projet trouvé, donc aucune image
      }
    }
    
    // Appliquer le filtre de projet si fourni
    if (project) {
      query = query.eq('id_projet', project);
    }
    
    // Appliquer le filtre d'orientation si fourni
    if (orientation) {
      query = query.eq('orientation', orientation.toLowerCase());
    }
    
    // Appliquer le filtre de recherche
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    // Appliquer le filtre de tag
    if (tag && tag.toLowerCase() !== 'toutes') {
      query = query.ilike('tags', `%${tag.toLowerCase()}%`);
    }
    
    // Appliquer le filtre d'onglet
    if (tab.toLowerCase() !== 'all') {
      query = query.ilike('tags', `%${tab.toLowerCase()}%`);
    }
    
    const { count, error } = await query;
    
    if (error) throw error;
    
    console.log(`Total count for filters: ${count}`);
    return count || 0;
    
  } catch (error) {
    console.error('Error counting images:', error);
    return 0;
  }
}
