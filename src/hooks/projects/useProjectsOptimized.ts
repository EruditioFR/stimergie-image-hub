/**
 * Optimized Projects Hook - Migration to unified cache system  
 * Replaces existing project hooks with optimized caching
 */

import { useOptimizedProjects, useCacheManagement } from '@/hooks/cache/useOptimizedCache';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProjectsOptimized = (clientId?: string) => {
  const { clearProjectsCache } = useCacheManagement();

  // Optimized fetch function
  const fetchFunction = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    let query = supabase
      .from('projets')
      .select(`
        *,
        clients!inner (
          id,
          nom,
          email,
          logo
        )
      `)
      .order('created_at', { ascending: false });

    // Apply client filter if specified
    if (clientId) {
      query = query.eq('id_client', clientId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return data || [];
  }, [clientId]);

  // Use optimized cache hook
  const query = useOptimizedProjects(clientId, fetchFunction);

  // Refresh function with cache invalidation
  const refreshProjects = useCallback(async () => {
    await clearProjectsCache(clientId);
    return query.refetch();
  }, [clearProjectsCache, clientId, query.refetch]);

  // Helper to get projects by client
  const getProjectsByClient = useCallback((targetClientId: string) => {
    const projects = query.data || [];
    return projects.filter(project => project.id_client === targetClientId);
  }, [query.data]);

  // Helper to get project by ID
  const getProjectById = useCallback((projectId: string) => {
    const projects = query.data || [];
    return projects.find(project => project.id === projectId);
  }, [query.data]);

  return {
    // Data
    projects: query.data || [],
    
    // States  
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Actions
    refreshProjects,
    getProjectsByClient,
    getProjectById,
    
    // Cache info
    cacheStatus: query.status,
    dataUpdatedAt: query.dataUpdatedAt,
    isStale: query.isStale
  };
};