
import { Project } from "@/types/project";
import { ViewMode } from "@/components/ui/ViewToggle";
import { ProjectsLoadingState } from "./ProjectsLoadingState";
import { ProjectsEmptyState } from "./ProjectsEmptyState";
import { ProjectCard } from "./ProjectCard";
import { ProjectsTable } from "./ProjectsTable";

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
    return <ProjectsLoadingState viewMode={viewMode} />;
  }

  if (projects.length === 0) {
    return <ProjectsEmptyState isEmpty={true} />;
  }

  // Card view
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    );
  }

  // List view
  return <ProjectsTable projects={projects} onEdit={onEdit} onDelete={onDelete} />;
}
