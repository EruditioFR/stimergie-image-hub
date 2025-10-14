
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectIdsForClient, getAccessibleProjectIds } from "./projectUtils";

// Cache for admin total count (5 minutes TTL)
let cachedAdminCount: number | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  userClientId: string | null,
  userId: string | null
): Promise<number> {
  try {
    // Check if we can use cached count for admin without filters
    const hasAnyFilter = search || tag || client || project || orientation;
    if (userRole === 'admin' && !hasAnyFilter) {
      const now = Date.now();
      if (cachedAdminCount !== null && cacheTime !== null && (now - cacheTime < CACHE_DURATION)) {
        console.log('Using cached admin count:', cachedAdminCount);
        return cachedAdminCount;
      }
    }

    // Pour admin_client et utilisateurs normaux, toujours filtrer par leur client ID
    if (['admin_client', 'user'].includes(userRole) && userClientId) {
      console.log('Non-admin user detected, forcing client filter in count even with tag filter:', userClientId);
      client = userClientId;
    }
    
    let query = supabase.from('images').select('*', { count: 'exact', head: true });
    
    // Obtenir et appliquer les IDs de projets si un client est sélectionné
    if (client) {
      if (userRole === 'admin') {
        const projetIds = await fetchProjectIdsForClient(client);
        
        if (projetIds && projetIds.length > 0) {
          query = query.in('id_projet', projetIds);
        } else {
          return 0;
        }
      } else if (userId) {
        const userAccessibleProjects = await getAccessibleProjectIds(userId, true);
        
        if (userAccessibleProjects.length === 0) {
          return 0;
        }
        
        // Enforce client ownership by intersecting with this client's projects
        const clientProjectIds = await fetchProjectIdsForClient(client);
        const allowedIds = clientProjectIds && clientProjectIds.length > 0
          ? userAccessibleProjects.filter(id => clientProjectIds.includes(id))
          : userAccessibleProjects;
        
        if (allowedIds.length === 0) return 0;
        query = query.in('id_projet', allowedIds);
      }
    } else if (['admin_client', 'user'].includes(userRole) && userId) {
      const userAccessibleProjects = await getAccessibleProjectIds(userId, true);
      
      if (userAccessibleProjects.length === 0) {
        return 0;
      }
      
      query = query.in('id_projet', userAccessibleProjects);
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
    
    // Cache the result for admins without filters
    if (userRole === 'admin' && !hasAnyFilter && count !== null) {
      cachedAdminCount = count;
      cacheTime = Date.now();
      console.log('Cached admin count:', count);
    }
    
    console.log(`Total count for filters: ${count}`);
    return count || 0;
    
  } catch (error) {
    console.error('Error counting images:', error);
    return 0;
  }
}
