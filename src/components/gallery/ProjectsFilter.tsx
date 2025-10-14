
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccessibleProjects } from '@/hooks/projects/useAccessibleProjects';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProjectsFilterProps {
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  className?: string;
  selectedClient: string | null;
}

export function ProjectsFilter({ selectedProject, onProjectChange, className, selectedClient }: ProjectsFilterProps) {
  const { projects, isLoading, error, getProjectsForClient } = useAccessibleProjects();
  const { userRole } = useAuth();
  const [filteredProjects, setFilteredProjects] = useState<Array<{ id: string; nom_projet: string }>>([]);

  useEffect(() => {
    console.log("Loading projects for ProjectsFilter, client:", selectedClient, "user role:", userRole);
    
    // For regular users, always show all accessible projects since they can only see 
    // projects they have access to through access periods or direct ownership
    if (userRole === 'user') {
      setFilteredProjects(projects.map(p => ({ id: p.id, nom_projet: p.nom_projet })));
      console.log(`Retrieved ${projects.length} accessible projects for user`);
    } else {
      // For admin users, filter by client if one is selected
      if (!selectedClient) {
        setFilteredProjects(projects.map(p => ({ id: p.id, nom_projet: p.nom_projet })));
      } else {
        const clientProjects = getProjectsForClient(selectedClient);
        setFilteredProjects(clientProjects.map(p => ({ id: p.id, nom_projet: p.nom_projet })));
        console.log(`Retrieved ${clientProjects.length} projects for client ${selectedClient}`);
      }
    }
  }, [selectedClient, projects, getProjectsForClient, userRole]);

  // Clear project selection when client changes
  useEffect(() => {
    if (selectedProject) {
      onProjectChange(null);
    }
  }, [selectedClient]); // Only depend on selectedClient, not onProjectChange or selectedProject

  // Show error if projects failed to load
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les projets accessibles"
      });
    }
  }, [error]);
  
  const handleValueChange = (value: string) => {
    // Convert 'all' to null for consistency with filter system
    console.log(`Project filter changed to: ${value}`);
    onProjectChange(value === 'all' ? null : value);
  };
  
  // If no accessible projects are available, don't show the filter
  if (filteredProjects.length === 0 && !isLoading) {
    if (!selectedClient) {
      console.log('No projects found for this client');
    } else {
      console.log('No accessible projects found');
    }
    return null;
  }
  
  return (
    <div className={className}>
      <Select 
        value={selectedProject || 'all'} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={isLoading ? "Chargement..." : "Filtrer par projet"} />
        </SelectTrigger>
        <SelectContent side="bottom" sideOffset={4} avoidCollisions={false} className="z-50 bg-background">
          <SelectGroup>
            <SelectItem value="all">Tous les projets</SelectItem>
            {filteredProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.nom_projet}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
