
import { useState } from "react";
import { Project } from "@/types/project";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ViewMode } from "@/components/ui/ViewToggle";
import { useProjects } from "@/hooks/useProjects";

export function ProjectsContainer() {
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
    deleteProject 
  } = useProjects();
  
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteDialog(true);
  };

  const handleFormSubmit = (project: Project) => {
    const success = isEditing
      ? updateProject(project)
      : addProject(project);
    
    if (success) {
      setShowForm(false);
      setIsEditing(false);
      setCurrentProject(null);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    const success = await deleteProject(projectToDelete);
    if (success) {
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div>
      <ProjectsHeader onAddClick={() => {
        setIsEditing(false);
        setCurrentProject(null);
        setShowForm(true);
      }} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {showForm ? (
          <ProjectFormDialog
            show={showForm}
            initialData={isEditing ? currentProject! : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setIsEditing(false);
              setCurrentProject(null);
            }}
          />
        ) : (
          <>
            <ProjectFilters
              clients={clients}
              clientFilter={clientFilter}
              onClientFilterChange={setClientFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <ProjectsList 
              projects={projects} 
              loading={loading} 
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              viewMode={viewMode}
            />
          </>
        )}
      </div>

      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteProject}
      />
    </div>
  );
}
