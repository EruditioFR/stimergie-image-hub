
import { useState } from "react";
import { ProjectsHeader } from "./ProjectsHeader";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectsList } from "./ProjectsList";
import { useProjects } from "@/hooks/useProjects";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { Project } from "@/types/project";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";

export function ProjectsContainer() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const {
    projects,
    loading,
    clients,
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const handleAddProject = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (projectToDelete) {
      setCurrentProject(projectToDelete);
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <ProjectsHeader 
        onAddClick={handleAddProject} 
        viewToggle={
          <ViewToggle 
            currentView={viewMode} 
            onViewChange={setViewMode} 
          />
        }
      />
      
      <div className="mt-8 mb-6">
        <ProjectFilters
          clients={clients}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </div>
      
      <ProjectsList 
        projects={projects} 
        loading={loading} 
        onEdit={handleEditProject} 
        onDelete={handleDeleteProject}
        viewMode={viewMode}
      />
      
      {/* Add Project Dialog */}
      <ProjectFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        clients={clients}
        onSubmit={addProject}
      />
      
      {/* Edit Project Dialog */}
      <ProjectFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        clients={clients}
        onSubmit={updateProject}
        initialData={currentProject || undefined}
      />
      
      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        projectName={currentProject?.nom_projet || ""}
        onConfirm={() => currentProject?.id && deleteProject(currentProject.id)}
      />
    </div>
  );
}
