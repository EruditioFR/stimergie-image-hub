
import { Folder, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

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
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Folder size={16} className="text-primary" />
          {project.nom_projet}
        </div>
      </TableCell>
      <TableCell>{project.client_name || "Non spécifié"}</TableCell>
      <TableCell>{project.type_projet || "Non spécifié"}</TableCell>
      <TableCell>{project.created_at ? formatDate(project.created_at) : "Non spécifié"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(project)}
              title="Modifier"
            >
              <Pencil size={16} />
            </Button>
          )}
          {onDelete && project.id && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(project.id!)}
              title="Supprimer"
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
