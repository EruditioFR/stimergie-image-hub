
import { Project } from "@/types/project";
import { ProjectTableRow } from "./ProjectTableRow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProjectsTableProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectsTable({ projects, onEdit, onDelete }: ProjectsTableProps) {
  // Sort projects by client_name first, then by nom_projet
  const sortedProjects = [...projects].sort((a, b) => {
    // First sort by client name
    const clientNameA = a.client_name || '';
    const clientNameB = b.client_name || '';
    
    if (clientNameA < clientNameB) return -1;
    if (clientNameA > clientNameB) return 1;
    
    // If client names are equal, sort by project name
    const projectNameA = a.nom_projet || '';
    const projectNameB = b.nom_projet || '';
    
    if (projectNameA < projectNameB) return -1;
    if (projectNameA > projectNameB) return 1;
    
    return 0;
  });

  return (
    <div className="w-full overflow-x-auto">
      <Table className="border-collapse table-fixed min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/6">Nom du projet</TableHead>
            <TableHead className="w-[80px]">Logo</TableHead>
            <TableHead className="w-1/6">Client</TableHead>
            <TableHead className="w-1/6">Type</TableHead>
            <TableHead className="w-1/6">Dossier</TableHead>
            <TableHead className="w-1/6">Date de création</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.map((project) => (
            <ProjectTableRow 
              key={project.id} 
              project={project} 
              onEdit={onEdit} 
              onDelete={onDelete} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
