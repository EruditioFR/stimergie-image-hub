
import { useProjectsData } from "./useProjectsData";
import { useProjectMutations } from "./useProjectMutations";
import { useAuth } from "@/context/AuthContext";

export function useProjects() {
  const { isAdmin, userRole, canAccessClient } = useAuth();
  
  const {
    projects,
    loading,
    clients,
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery,
    fetchProjects
  } = useProjectsData();
  
  const {
    addProject,
    updateProject,
    deleteProject
  } = useProjectMutations(fetchProjects);

  return {
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
  };
}
