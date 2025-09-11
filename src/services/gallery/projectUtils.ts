
/**
 * Project utilities for gallery - Uses accessible projects instead of direct client filtering
 */

import { supabase } from '@/integrations/supabase/client';

// Cache for accessible projects to avoid repeated calls
let accessibleProjectsCache: { userId: string; projectIds: string[] } | null = null;

/**
 * Get accessible project IDs for the current user
 * Uses get_accessible_projects function which respects RLS and access periods
 */
export async function getAccessibleProjectIds(userId: string): Promise<string[]> {
  try {
    // Use cache if available for the same user
    if (accessibleProjectsCache?.userId === userId) {
      console.log('📋 Using cached accessible projects:', accessibleProjectsCache.projectIds.length);
      return accessibleProjectsCache.projectIds;
    }

    console.log('🔍 Fetching accessible projects for user:', userId);
    
    const { data, error } = await supabase
      .rpc('get_accessible_projects', {
        user_id: userId,
        check_time: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error fetching accessible projects:', error);
      throw error;
    }

    const projectIds = data?.map(item => item.project_id) || [];
    console.log('✅ Retrieved accessible project IDs:', projectIds);

    // Cache the result
    accessibleProjectsCache = { userId, projectIds };

    return projectIds;
  } catch (error) {
    console.error('Error in getAccessibleProjectIds:', error);
    return [];
  }
}

/**
 * Clear the accessible projects cache (call when user changes or access changes)
 */
export function clearAccessibleProjectsCache(): void {
  console.log('🧹 Clearing accessible projects cache');
  accessibleProjectsCache = null;
}

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
