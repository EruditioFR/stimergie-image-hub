
import { Project } from "@/pages/Projects";
import { Folder, Building2, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectsListProps {
  projects: Project[];
  loading?: boolean;
}

export function ProjectsList({ projects, loading = false }: ProjectsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white shadow-sm rounded-lg p-6 border border-border">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium mb-2">Aucun projet trouvé</h3>
        <p className="text-muted-foreground">
          {projects.length === 0 ? "Aucun projet n'est enregistré dans le système." : "Aucun projet ne correspond au filtre sélectionné."}
        </p>
      </div>
    );
  }

  function formatDate(dateString: string | undefined) {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (error) {
      return dateString;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className="bg-white shadow-sm rounded-lg p-6 border border-border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
            <Folder size={18} className="text-primary" />
            {project.nom_projet}
          </h3>
          
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Building2 size={16} className="text-muted-foreground" />
              {project.client_name || "Client non spécifié"}
            </p>
            
            {project.type_projet && (
              <p className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-primary/10 rounded-full"></span>
                {project.type_projet}
              </p>
            )}
            
            {project.created_at && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={16} />
                Créé le {formatDate(project.created_at)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
