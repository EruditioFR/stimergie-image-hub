/**
 * Hook for fetching projects accessible to the current user
 * Uses get_accessible_projects function instead of direct client filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface AccessibleProject {
  id: string;
  nom_projet: string;
  nom_dossier?: string;
  type_projet?: string;
  id_client: string;
  created_at: string;
  clients?: {
    id: string;
    nom: string;
    logo?: string;
  };
}

export const useAccessibleProjects = () => {
  const { user, userRole } = useAuth();
  const [projects, setProjects] = useState<AccessibleProject[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessibleProjects = async () => {
    if (!user) {
      setProjects([]);
      setProjectIds([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching accessible projects for user:', user.id, 'role:', userRole);

      // Use the SECURITY DEFINER function to get full project details
      // This bypasses RLS and returns complete project info with client data
      const { data: projectsData, error: projectsError } = await supabase
        .rpc('get_accessible_projects_details', {
          user_id: user.id,
          check_time: new Date().toISOString()
        });

      if (projectsError) {
        throw projectsError;
      }

      console.log('✅ Retrieved accessible projects:', projectsData?.length || 0);

      // Transform the data to match our interface
      const formattedProjects: AccessibleProject[] = (projectsData || []).map(project => ({
        id: project.id,
        nom_projet: project.nom_projet,
        nom_dossier: project.nom_dossier || undefined,
        type_projet: project.type_projet || undefined,
        id_client: project.id_client,
        created_at: project.created_at,
        clients: project.client_id ? {
          id: project.client_id,
          nom: project.client_nom,
          logo: project.client_logo || undefined
        } : undefined
      }));

      setProjects(formattedProjects);
      setProjectIds(formattedProjects.map(p => p.id));

    } catch (err) {
      console.error('❌ Error fetching accessible projects:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProjects([]);
      setProjectIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh when user changes
  useEffect(() => {
    fetchAccessibleProjects();
  }, [user?.id, userRole]);

  // Helper function to check if user has access to a specific project
  const hasAccessToProject = useCallback((projectId: string): boolean => {
    return projectIds.includes(projectId);
  }, [projectIds]);

  // Helper function to get projects for a specific client (from accessible projects)
  const getProjectsForClient = useCallback((clientId: string): AccessibleProject[] => {
    return projects.filter(project => project.id_client === clientId);
  }, [projects]);

  return {
    projects,
    projectIds,
    isLoading,
    error,
    hasAccessToProject,
    getProjectsForClient,
    refreshProjects: fetchAccessibleProjects
  };
};