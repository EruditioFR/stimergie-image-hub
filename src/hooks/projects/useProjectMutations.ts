
import { toast } from "sonner";
import { Project } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";

export function useProjectMutations(reloadProjects: () => Promise<void>) {
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
        await reloadProjects();
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
      
      await reloadProjects();
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
      
      await reloadProjects();
      toast.success("Le projet a été supprimé avec succès.");
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      toast.error("Impossible de supprimer le projet.");
      return false;
    }
  };

  return {
    addProject,
    updateProject,
    deleteProject
  };
}
