
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/hooks/use-toast";

export function useProjectsData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([]);
  const { toast: uiToast } = useToast();
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjects();
    fetchClients();
  }, [clientFilter, searchQuery]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom')
        .order('nom');

      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log("Fetching projects");
      
      // Build the query
      let query = supabase
        .from('projets')
        .select(`
          *,
          clients:id_client (nom)
        `);
      
      // Apply client filter if selected
      if (clientFilter) {
        query = query.eq('id_client', clientFilter);
      }
      
      // Apply search filter if provided
      if (searchQuery.trim()) {
        query = query.or(`nom_projet.ilike.%${searchQuery}%,type_projet.ilike.%${searchQuery}%,nom_dossier.ilike.%${searchQuery}%,clients(nom).ilike.%${searchQuery}%`);
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
          nom_dossier: project.nom_dossier
        }));
        
        setProjects(mappedProjects);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      uiToast({
        title: "Erreur",
        description: "Impossible de récupérer les projets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
