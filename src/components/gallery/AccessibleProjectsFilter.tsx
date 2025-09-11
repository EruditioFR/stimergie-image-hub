/**
 * Projects Filter that uses accessible projects instead of direct client filtering
 */

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccessibleProjects } from '@/hooks/projects/useAccessibleProjects';

interface AccessibleProjectsFilterProps {
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  selectedClient?: string | null;
  placeholder?: string;
}

export const AccessibleProjectsFilter = ({ 
  selectedProject, 
  onProjectChange,
  selectedClient,
  placeholder = "Tous les projets" 
}: AccessibleProjectsFilterProps) => {
  const { projects, isLoading, error } = useAccessibleProjects();
  const [filteredProjects, setFilteredProjects] = useState(projects);

  console.log('📋 AccessibleProjectsFilter - Projects loaded:', projects.length);

  // Filter projects by selected client if provided
  useEffect(() => {
    if (selectedClient) {
      const clientProjects = projects.filter(project => project.id_client === selectedClient);
      setFilteredProjects(clientProjects);
      console.log(`🔍 Filtered to ${clientProjects.length} projects for client:`, selectedClient);
    } else {
      setFilteredProjects(projects);
      console.log(`📋 Showing all ${projects.length} accessible projects`);
    }
  }, [projects, selectedClient]);

  // Reset project selection if current project is not in filtered list
  useEffect(() => {
    if (selectedProject && !filteredProjects.some(p => p.id === selectedProject)) {
      console.log('🔄 Resetting project selection - current project not in accessible list');
      onProjectChange(null);
    }
  }, [filteredProjects, selectedProject, onProjectChange]);

  if (error) {
    console.error('❌ Error loading accessible projects:', error);
    return (
      <div className="text-red-500 text-sm">
        Erreur: {error}
      </div>
    );
  }

  return (
    <Select
      value={selectedProject || ""}
      onValueChange={(value) => onProjectChange(value || null)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={isLoading ? "Chargement..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{placeholder}</SelectItem>
        {filteredProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.nom_projet}
            {project.clients?.nom && (
              <span className="text-muted-foreground ml-2">
                ({project.clients.nom})
              </span>
            )}
          </SelectItem>
        ))}
        {filteredProjects.length === 0 && !isLoading && (
          <SelectItem value="no-projects" disabled>
            {selectedClient ? 'Aucun projet accessible pour ce client' : 'Aucun projet accessible'}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};