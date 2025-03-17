
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { useClientsData } from "./useClientsData";
import { useProjectFilters } from "./useProjectFilters";

export function useProjectsData() {
  const [projects, setProjects] = useState<Project[]>([]);
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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log("Fetching projects");
      
      // Build the query
      let query = supabase
        .from('projets')
        .select(`
          *,
          clients:id_client (nom, logo)
        `);
      
      // Apply client filter if selected
      if (clientFilter) {
        query = query.eq('id_client', clientFilter);
      }
      
      // Apply search filter if provided
      if (searchQuery.trim()) {
        // If client filter is active, search within the filtered client's projects
        // Otherwise search across all projects
        query = query.or(`nom_projet.ilike.%${searchQuery}%,type_projet.ilike.%${searchQuery}%,nom_dossier.ilike.%${searchQuery}%`);
      }
      
      // Sort by client name and then project name
      query = query.order('id_client').order('nom_projet');
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      
      if (data) {
        console.log(`Retrieved ${data.length} projects from database`);
        const mappedProjects: Project[] = data.map(project => ({
          id: project.id,
          nom_projet: project.nom_projet,
          type_projet: project.type_projet,
          id_client: project.id_client,
          created_at: project.created_at,
          client_name: project.clients?.nom,
          client_logo: project.clients?.logo,
          nom_dossier: project.nom_dossier
        }));
        
        setProjects(mappedProjects);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les projets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [clientFilter, searchQuery]);

  return {
    projects,
    loading,
    clients,
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery,
    fetchProjects,
  };
}
