
import { Folder, Pencil, Trash2, HardDrive } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { ProjectImagePreview } from "./ProjectImagePreview";

interface ProjectTableRowProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectTableRow({ project, onEdit, onDelete }: ProjectTableRowProps) {
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
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell className="font-medium p-2 align-middle w-[200px]">
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-primary flex-shrink-0" />
            <span className="truncate max-w-[150px]">{project.nom_projet}</span>
          </div>
        </TableCell>
        
        {/* Logo Column */}
        <TableCell className="p-2 align-middle w-[100px]">
          <div className="flex justify-center">
            {project.client_logo ? (
              <Avatar className="h-10 w-10 flex-shrink-0">
                <img 
                  src={project.client_logo} 
                  alt={`Logo de ${project.client_name}`}
                  className="h-full w-full object-contain"
                />
              </Avatar>
            ) : (
              <div className="h-10 w-10 flex-shrink-0" />
            )}
          </div>
        </TableCell>
        
        {/* Client Name Column */}
        <TableCell className="p-2 align-middle w-[150px]">
          <span className="truncate max-w-[120px] block">{project.client_name || "Non spécifié"}</span>
        </TableCell>
        
        <TableCell className="p-2 align-middle w-[150px]">
          <span className="truncate max-w-[120px] block">{project.type_projet || "Non spécifié"}</span>
        </TableCell>
        
        <TableCell className="p-2 align-middle w-[150px]">
          {project.nom_dossier ? (
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-muted-foreground flex-shrink-0" />
              <span className="truncate max-w-[120px]">{project.nom_dossier}</span>
            </div>
          ) : (
            "Non spécifié"
          )}
        </TableCell>
        
        <TableCell className="p-2 align-middle w-[180px]">{project.created_at ? formatDate(project.created_at) : "Non spécifié"}</TableCell>
        
        <TableCell className="p-2 align-middle text-right w-[100px]">
          <div className="flex justify-end gap-2">
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
        </TableCell>
      </TableRow>
    </ProjectImagePreview>
  );
}
