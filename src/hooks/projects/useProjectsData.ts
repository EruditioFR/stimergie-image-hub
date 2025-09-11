
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { useClientsData } from "./useClientsData";
import { useProjectFilters } from "./useProjectFilters";
import { useAccessibleProjects } from './useAccessibleProjects';

export function useProjectsData() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { 
    clients,
    fetchClients
  } = useClientsData();
  
  const {
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery
  } = useProjectFilters();

  const {
    projects: accessibleProjects,
    projectIds,
    isLoading: projectsLoading,
    error: projectsError,
    refreshProjects
  } = useAccessibleProjects();

  // Filter projects based on client filter and search
  const filteredProjects: Project[] = accessibleProjects.map(project => ({
    id: project.id,
    nom_projet: project.nom_projet,
    type_projet: project.type_projet || '', // Ensure required field
    id_client: project.id_client,
    created_at: project.created_at,
    client_name: project.clients?.nom,
    client_logo: project.clients?.logo,
    nom_dossier: project.nom_dossier
  })).filter(project => {
    // Apply client filter if selected
    if (clientFilter && project.id_client !== clientFilter) {
      return false;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      // If search query looks like a UUID, search by project ID
      if (searchQuery.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
        return project.id === searchQuery;
      }
      // Otherwise search in project name, type, and folder name
      const query = searchQuery.toLowerCase();
      return (
        project.nom_projet?.toLowerCase().includes(query) ||
        project.type_projet?.toLowerCase().includes(query) ||
        project.nom_dossier?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Update loading state
  useEffect(() => {
    setLoading(projectsLoading);
  }, [projectsLoading]);

  // Show error if projects failed to load
  useEffect(() => {
    if (projectsError) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les projets accessibles.",
        variant: "destructive"
      });
    }
  }, [projectsError, toast]);

  const fetchProjects = async () => {
    await refreshProjects();
  };

  useEffect(() => {
    // No need to fetch again, filtering happens in memory
  }, [clientFilter, searchQuery]);

  return {
    projects: filteredProjects,
    loading,
    clients,
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery,
    fetchProjects,
  };
}
