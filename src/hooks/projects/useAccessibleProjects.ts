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

      // 1. Get accessible project IDs using the RLS-compliant function
      const { data: accessibleProjectIds, error: idsError } = await supabase
        .rpc('get_accessible_projects', {
          user_id: user.id,
          check_time: new Date().toISOString()
        });

      if (idsError) {
        throw idsError;
      }

      const projectIds = accessibleProjectIds?.map(item => item.project_id) || [];
      console.log('📋 Accessible project IDs:', projectIds);
      
      setProjectIds(projectIds);

      if (projectIds.length === 0) {
        console.log('⚠️ No accessible projects found');
        setProjects([]);
      } else {
        // 2. Fetch full project details for accessible projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projets')
          .select(`
            id,
            nom_projet,
            nom_dossier,
            type_projet,
            id_client,
            created_at,
            clients:id_client (
              id,
              nom,
              logo
            )
          `)
          .in('id', projectIds)
          .order('nom_projet');

        if (projectsError) {
          throw projectsError;
        }

        console.log('✅ Retrieved accessible projects:', projectsData?.length || 0);
        
        // Fallback: if RLS blocks direct project access, fetch via images table
        if ((!projectsData || projectsData.length === 0) && projectIds.length > 0) {
          console.log('⚠️ Direct project query returned empty, trying fallback via images table...');
          
          const { data: imagesData, error: imagesError } = await supabase
            .from('images')
            .select(`
              id_projet,
              projets!inner (
                id,
                nom_projet,
                nom_dossier,
                type_projet,
                id_client,
                created_at,
                clients:id_client (
                  id,
                  nom,
                  logo
                )
              )
            `)
            .in('id_projet', projectIds);
          
          if (imagesError) {
            console.error('❌ Fallback query error:', imagesError);
          } else if (imagesData && imagesData.length > 0) {
            // Deduplicate projects from images
            const projectsMap = new Map<string, AccessibleProject>();
            imagesData.forEach(item => {
              const project = item.projets;
              if (project && !projectsMap.has(project.id)) {
                projectsMap.set(project.id, {
                  id: project.id,
                  nom_projet: project.nom_projet,
                  nom_dossier: project.nom_dossier,
                  type_projet: project.type_projet,
                  id_client: project.id_client,
                  created_at: project.created_at,
                  clients: project.clients
                });
              }
            });
            
            const fallbackProjects = Array.from(projectsMap.values())
              .sort((a, b) => a.nom_projet.localeCompare(b.nom_projet));
            
            console.log('✅ Fallback retrieved projects:', fallbackProjects.length);
            setProjects(fallbackProjects);
          } else {
            setProjects([]);
          }
        } else {
          setProjects(projectsData || []);
        }
      }

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