
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useAuth } from "@/context/AuthContext";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([]);
  const { toast: uiToast } = useToast();
  const { isAdmin, userRole, canAccessClient } = useAuth();

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
      console.log("Fetching projects, isAdmin:", isAdmin());
      
      // Build the query - admins can see all projects
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
      
      // Log user role and access level for debugging
      console.log(`User role: ${userRole}, isAdmin: ${isAdmin()}`);
      
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

  const addProject = async (project: Project) => {
    try {
      const { data, error } = await supabase
        .from('projets')
        .insert([
          { 
            nom_projet: project.nom_projet,
            type_projet: project.type_projet,
            id_client: project.id_client,
            nom_dossier: project.nom_dossier
          }
        ])
        .select(`
          *,
          clients:id_client (nom)
        `);
      
      if (error) {
        console.error("Supabase insert error details:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const newProject: Project = {
          id: data[0].id,
          nom_projet: data[0].nom_projet,
          type_projet: data[0].type_projet,
          id_client: data[0].id_client,
          created_at: data[0].created_at,
          client_name: data[0].clients?.nom,
          nom_dossier: data[0].nom_dossier
        };
        
        setProjects(prevProjects => [...prevProjects, newProject]);
        toast.success(`${project.nom_projet} a été ajouté avec succès.`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors de l'ajout du projet:", error);
      toast.error("Impossible d'ajouter le projet.");
      return false;
    }
  };

  const updateProject = async (project: Project) => {
    if (!project.id) return false;
    
    try {
      const { error } = await supabase
        .from('projets')
        .update({
          nom_projet: project.nom_projet,
          type_projet: project.type_projet,
          id_client: project.id_client,
          nom_dossier: project.nom_dossier
        })
        .eq('id', project.id);
      
      if (error) {
        console.error("Supabase update error details:", error);
        throw error;
      }
      
      const { data: clientData } = await supabase
        .from('clients')
        .select('nom')
        .eq('id', project.id_client)
        .single();
      
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === project.id ? {
            ...project,
            client_name: clientData?.nom
          } : p
        )
      );
      
      toast.success(`${project.nom_projet} a été mis à jour avec succès.`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      toast.error("Impossible de mettre à jour le projet.");
      return false;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projets')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        console.error("Supabase delete error details:", error);
        throw error;
      }
      
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      toast.success("Le projet a été supprimé avec succès.");
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      toast.error("Impossible de supprimer le projet.");
      return false;
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
    addProject,
    updateProject,
    deleteProject,
  };
}
