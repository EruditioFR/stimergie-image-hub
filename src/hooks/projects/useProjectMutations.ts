
import { toast } from "sonner";
import { Project } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { useGalleryCacheSync } from "@/hooks/gallery/useGalleryCacheSync";

export function useProjectMutations(reloadProjects: () => Promise<void>) {
  const { invalidateGalleryCaches, invalidateClientSpecificCaches } = useGalleryCacheSync();

  const addProject = async (project: Project) => {
    try {
      console.log('Adding project:', project.nom_projet, 'for client:', project.id_client);
      
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
        console.log('Project added successfully with automatic access period creation');
        
        // Invalider les caches de galerie pour ce client spécifique
        await invalidateClientSpecificCaches(project.id_client);
        
        // Recharger la liste des projets
        await reloadProjects();
        
        toast.success(`${project.nom_projet} a été ajouté avec succès. Une période d'accès par défaut a été créée automatiquement.`);
        
        console.log('Cache invalidation completed after project addition');
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
      console.log('Updating project:', project.nom_projet, 'for client:', project.id_client);
      
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
      
      console.log('Project updated successfully, invalidating caches...');
      
      // Invalider les caches de galerie pour ce client spécifique
      await invalidateClientSpecificCaches(project.id_client);
      
      // Recharger la liste des projets
      await reloadProjects();
      
      toast.success(`${project.nom_projet} a été mis à jour avec succès.`);
      
      console.log('Cache invalidation completed after project update');
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      toast.error("Impossible de mettre à jour le projet.");
      return false;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      console.log('Deleting project:', projectId);
      
      // Récupérer d'abord les infos du projet pour connaître le client
      const { data: projectData, error: fetchError } = await supabase
        .from('projets')
        .select('id_client, nom_projet')
        .eq('id', projectId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching project data:", fetchError);
        throw fetchError;
      }
      
      const { error } = await supabase
        .from('projets')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        console.error("Supabase delete error details:", error);
        throw error;
      }
      
      console.log('Project deleted successfully, invalidating caches...');
      
      // Invalider les caches de galerie pour ce client spécifique
      if (projectData?.id_client) {
        await invalidateClientSpecificCaches(projectData.id_client);
      }
      
      // Recharger la liste des projets
      await reloadProjects();
      
      toast.success("Le projet a été supprimé avec succès.");
      
      console.log('Cache invalidation completed after project deletion');
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
