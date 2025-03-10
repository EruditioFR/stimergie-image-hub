
import { useState, useEffect } from "react";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserGreetingBar } from "@/components/ui/UserGreetingBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Project interface matching the database schema
export interface Project {
  id?: string;
  nom_projet: string;
  type_projet?: string;
  id_client: string;
  created_at?: string;
  client_name?: string; // For displaying client name in the list
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const { toast: uiToast } = useToast();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch projects with client names using a join query
      const { data, error } = await supabase
        .from('projets')
        .select(`
          *,
          clients:id_client (nom)
        `);
      
      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      
      if (data) {
        // Transform the data to include client name directly in the project object
        const mappedProjects: Project[] = data.map(project => ({
          id: project.id,
          nom_projet: project.nom_projet,
          type_projet: project.type_projet,
          id_client: project.id_client,
          created_at: project.created_at,
          client_name: project.clients?.nom
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
            id_client: project.id_client
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
          client_name: data[0].clients?.nom
        };
        
        setProjects(prevProjects => [...prevProjects, newProject]);
        setShowForm(false);
        toast.success(`${project.nom_projet} a été ajouté avec succès.`);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du projet:", error);
      toast.error("Impossible d'ajouter le projet.");
    }
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setShowForm(true);
  };

  const updateProject = async (project: Project) => {
    if (!project.id) return;
    
    try {
      const { error } = await supabase
        .from('projets')
        .update({
          nom_projet: project.nom_projet,
          type_projet: project.type_projet,
          id_client: project.id_client
        })
        .eq('id', project.id);
      
      if (error) {
        console.error("Supabase update error details:", error);
        throw error;
      }
      
      // Get the updated client name
      const { data: clientData } = await supabase
        .from('clients')
        .select('nom')
        .eq('id', project.id_client)
        .single();
      
      // Update project in local state
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === project.id ? {
            ...project,
            client_name: clientData?.nom
          } : p
        )
      );
      
      setShowForm(false);
      setIsEditing(false);
      setCurrentProject(null);
      toast.success(`${project.nom_projet} a été mis à jour avec succès.`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      toast.error("Impossible de mettre à jour le projet.");
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const { error } = await supabase
        .from('projets')
        .delete()
        .eq('id', projectToDelete);
      
      if (error) {
        console.error("Supabase delete error details:", error);
        throw error;
      }
      
      // Remove project from local state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete));
      toast.success("Le projet a été supprimé avec succès.");
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      toast.error("Impossible de supprimer le projet.");
    } finally {
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };

  const handleFormSubmit = (project: Project) => {
    if (isEditing) {
      updateProject(project);
    } else {
      addProject(project);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <UserGreetingBar />
      <div className="pt-16">
        <ProjectsHeader onAddClick={() => {
          setIsEditing(false);
          setCurrentProject(null);
          setShowForm(true);
        }} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          {showForm ? (
            <ProjectForm 
              initialData={isEditing ? currentProject! : undefined}
              onSubmit={handleFormSubmit} 
              onCancel={() => {
                setShowForm(false);
                setIsEditing(false);
                setCurrentProject(null);
              }} 
            />
          ) : (
            <ProjectsList 
              projects={projects} 
              loading={loading} 
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          )}
        </div>
      </div>
      <Footer />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce projet seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
