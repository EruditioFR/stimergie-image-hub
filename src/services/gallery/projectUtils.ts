
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch project IDs for a client, with caching (ADMIN USE ONLY)
 * This function should only be used by admin users as it tries to fetch ALL projects for a client
 * Non-admin users should use getAccessibleProjects() instead
 */
export async function fetchProjectIdsForClient(client: string | null): Promise<string[] | null> {
  if (!client) return null;
  
  const cacheKey = `projectIds-${client}`;
  const cachedProjetIds = sessionStorage.getItem(cacheKey);
  
  if (cachedProjetIds) {
    const projetIds = JSON.parse(cachedProjetIds);
    console.log('Using cached project IDs:', projetIds.length);
    return projetIds;
  } else {
    // This query works only for admin users due to RLS policies
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
      sessionStorage.setItem(cacheKey, JSON.stringify([]));
      return [];
    }
    
    const projetIds = projetData.map(projet => projet.id);
    console.log('Project IDs for client:', projetIds.length);
    
    sessionStorage.setItem(cacheKey, JSON.stringify(projetIds));
    return projetIds;
  }
}

/**
 * Clear corrupted project caches for non-admin users
 * This helps resolve cases where empty project lists were cached due to RLS restrictions
 */
export function clearCorruptedProjectCache(clientId: string | null) {
  if (clientId) {
    const cacheKey = `projectIds-${clientId}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      const projetIds = JSON.parse(cachedData);
      // If cached data is an empty array, it might be corrupted for non-admin users
      if (Array.isArray(projetIds) && projetIds.length === 0) {
        console.log('Clearing potentially corrupted project cache for client:', clientId);
        sessionStorage.removeItem(cacheKey);
      }
    }
  }
}
