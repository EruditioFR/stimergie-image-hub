
import { Project } from "@/types/project";
import { ProjectsLoadingState } from "./ProjectsLoadingState";
import { ProjectsEmptyState } from "./ProjectsEmptyState";
import { ProjectCard } from "./ProjectCard";
import { ProjectsTable } from "./ProjectsTable";
import { ViewMode } from "@/components/ui/ViewToggle";
import { useAuth } from "@/context/AuthContext";

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
  const { userRole } = useAuth();
  const canManageProjects = userRole === 'admin';

  if (loading) {
    return <ProjectsLoadingState viewMode={viewMode} />;
  }

  if (projects.length === 0) {
    return <ProjectsEmptyState isEmpty={true} />;
  }

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

  // Render card or list view based on viewMode
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onEdit={canManageProjects ? onEdit : undefined} 
            onDelete={canManageProjects ? onDelete : undefined} 
          />
        ))}
      </div>
    );
  }

  // List view
  return (
    <ProjectsTable 
      projects={sortedProjects} 
      onEdit={canManageProjects ? onEdit : undefined} 
      onDelete={canManageProjects ? onDelete : undefined} 
    />
  );
}
