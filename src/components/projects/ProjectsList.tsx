
import { Project } from "@/types/project";
import { Folder, Building2, Calendar, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ViewMode } from "@/components/ui/ViewToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface ProjectsListProps {
  projects: Project[];
  loading?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  viewMode?: ViewMode;
}

export function ProjectsList({ 
  projects, 
  loading = false, 
  onEdit, 
  onDelete,
  viewMode = "card"
}: ProjectsListProps) {
  if (loading) {
    return viewMode === "card" ? (
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
    ) : (
      <div className="w-full">
        <Skeleton className="h-12 w-full mb-4" />
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-16 w-full mb-2" />
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

  // Card view
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder size={18} className="text-primary" />
                  {project.nom_projet}
                </CardTitle>
                <div className="flex gap-2">
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
              </div>
            </CardHeader>
            
            <CardContent>
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
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom du projet</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
