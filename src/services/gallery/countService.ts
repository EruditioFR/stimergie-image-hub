
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectIdsForClient } from "./projectUtils";
import { toast } from "sonner";

/**
 * Calcule le nombre total d'images sans faire d'appel API si possible
 */
export async function fetchTotalImageCount(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null,
  project: string | null,
  userRole: string = "",
  userClientId: string | null = null
): Promise<number> {
  const cacheKey = `imageCount-${search}-${tag}-${tab}-${client}-${project}-${userRole}-${userClientId}`;
  const cachedCount = sessionStorage.getItem(cacheKey);
  
  if (cachedCount) {
    console.log('Using cached image count:', cachedCount);
    return parseInt(cachedCount, 10);
  }
  
  try {
    let query = supabase
      .from('images')
      .select('id', { count: 'exact', head: true });
    
    // Pour admin_client et utilisateurs normaux, toujours filtrer par leur client ID
    if (['admin_client', 'user'].includes(userRole) && userClientId) {
      client = userClientId;
    }
    
    // Appliquer le filtre de client si fourni
    if (client) {
      const projetIds = await fetchProjectIdsForClient(client);
      
      if (projetIds && projetIds.length > 0) {
        query = query.in('id_projet', projetIds);
      } else {
        return 0;
      }
    }
    
    // Appliquer les autres filtres
    if (project) {
      query = query.eq('id_projet', project);
    }
    
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    if (tag && tag.toLowerCase() !== 'toutes') {
      query = query.ilike('tags', `%${tag.toLowerCase()}%`);
    }
    
    if (tab.toLowerCase() !== 'all') {
      query = query.ilike('tags', `%${tab.toLowerCase()}%`);
    }
    
    // Exécuter la requête
    const { count, error } = await query;
    
    if (error) {
      console.error('Error fetching image count:', error);
      return 0;
    }
    
    if (count !== null) {
      sessionStorage.setItem(cacheKey, count.toString());
      console.log(`Cached image count: ${count}`);
      return count;
    }
    
    return 0;
  } catch (error) {
    console.error('Error counting images:', error);
    return 0;
  }
}
