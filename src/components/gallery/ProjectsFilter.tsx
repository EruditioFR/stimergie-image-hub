
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectsFilterProps {
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  className?: string;
  selectedClient: string | null;
}

export function ProjectsFilter({ 
  selectedProject, 
  onProjectChange, 
  className, 
  selectedClient 
}: ProjectsFilterProps) {
  const [projects, setProjects] = useState<{ id: string; nom_projet: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadProjects = async () => {
      if (!selectedClient) {
        setProjects([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projets')
          .select('id, nom_projet')
          .eq('id_client', selectedClient)
          .order('nom_projet');
          
        if (error) throw error;
        
        setProjects(data || []);
        
        // Reset project selection if client changed
        if (selectedProject) {
          const projectExists = data?.some(p => p.id === selectedProject);
          if (!projectExists) {
            onProjectChange(null);
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        toast.error("Impossible de charger la liste des projets");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, [selectedClient, selectedProject, onProjectChange]);
  
  // If no client is selected or no projects available, don't show the filter
  if ((!selectedClient || projects.length === 0) && !isLoading) {
    return null;
  }
  
  return (
    <div className={className}>
      <Select 
        value={selectedProject || 'all'} 
        onValueChange={(value) => onProjectChange(value === 'all' ? null : value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par projet" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((project) => (
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
