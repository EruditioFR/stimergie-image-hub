
import { Folder, Building2, Calendar, Pencil, Trash2, HardDrive } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ProjectImagePreview } from "./ProjectImagePreview";

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  function formatDate(dateString: string | undefined) {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (error) {
      return dateString;
    }
  }

  return (
    <ProjectImagePreview projectId={project.id!}>
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg flex items-start gap-2">
              <Folder size={18} className="text-primary flex-shrink-0 mt-1" />
              <span className="break-words">{project.nom_projet}</span>
            </CardTitle>
            <div className="flex gap-2 flex-shrink-0">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  title="Modifier"
                >
                  <Pencil size={16} />
                </Button>
              )}
              {onDelete && project.id && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id!);
                  }}
                  title="Supprimer"
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col justify-between">
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              {project.client_logo ? (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <img 
                    src={project.client_logo} 
                    alt={`Logo de ${project.client_name}`}
                    className="h-full w-full object-contain"
                  />
                </Avatar>
              ) : (
                <Building2 size={16} className="text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{project.client_name || "Client non spécifié"}</span>
            </p>
            
            {project.type_projet && (
              <p className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-primary/10 rounded-full flex-shrink-0"></span>
                <span className="truncate">{project.type_projet}</span>
              </p>
            )}
            
            {project.nom_dossier && (
              <p className="flex items-center gap-2">
                <HardDrive size={16} className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">Dossier: {project.nom_dossier}</span>
              </p>
            )}
          </div>
          
          {project.created_at && (
            <p className="flex items-center gap-2 text-muted-foreground mt-3 pt-3 border-t border-border">
              <Calendar size={16} className="flex-shrink-0" />
              <span className="truncate">Créé le {formatDate(project.created_at)}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </ProjectImagePreview>
  );
}
