
import { Project } from "@/types/project";
import { Pencil, Trash2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectsTableProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectsTable({ projects, onEdit, onDelete }: ProjectsTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projet</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Dossier</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-muted-foreground" />
                  {project.nom_projet || <span className="italic text-muted-foreground">Sans nom</span>}
                </div>
              </TableCell>
              <TableCell>
                {project.type_projet ? (
                  <Badge variant="outline">{project.type_projet}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{project.client_name || "Non spécifié"}</TableCell>
              <TableCell>{project.nom_dossier || "-"}</TableCell>
              <TableCell>
                {project.created_at ? (
                  formatDistanceToNow(new Date(project.created_at), {
                    addSuffix: true,
                    locale: fr
                  })
                ) : (
                  "-"
                )}
              </TableCell>
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
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(project.id)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
