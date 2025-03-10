
import { useState, useEffect } from "react";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserGreetingBar } from "@/components/ui/UserGreetingBar";

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      toast({
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
        toast({
          title: "Projet ajouté",
          description: `${project.nom_projet} a été ajouté avec succès.`
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du projet:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le projet.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <UserGreetingBar />
      <div className="pt-16">
        <ProjectsHeader onAddClick={() => setShowForm(true)} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          {showForm ? (
            <ProjectForm 
              onSubmit={addProject} 
              onCancel={() => setShowForm(false)} 
            />
          ) : (
            <ProjectsList projects={projects} loading={loading} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
