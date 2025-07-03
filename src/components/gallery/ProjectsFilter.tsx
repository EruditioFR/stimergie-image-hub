
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProjectsFilterProps {
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  className?: string;
  selectedClient: string | null;
}

export function ProjectsFilter({ selectedProject, onProjectChange, className, selectedClient }: ProjectsFilterProps) {
  const [projects, setProjects] = useState<Array<{ id: string; nom_projet: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        console.log("Loading projects for ProjectsFilter, client:", selectedClient);
        
        // Clear project selection when client changes
        if (selectedProject) {
          onProjectChange(null);
        }
        
        // If no client is selected, clear projects list
        if (!selectedClient) {
          setProjects([]);
          setIsLoading(false);
          return;
        }
        
        // Query projects for the selected client
        const { data, error } = await supabase
          .from('projets')
          .select('id, nom_projet')
          .eq('id_client', selectedClient)
          .order('nom_projet');
        
        if (error) {
          console.error('Error loading projects:', error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger la liste des projets"
          });
          return;
        }
        
        if (data) {
          console.log(`Retrieved ${data.length} projects for client ${selectedClient}`);
          setProjects(data);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la liste des projets"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, [selectedClient, onProjectChange]);
  
  const handleValueChange = (value: string) => {
    // Convert 'all' to null for consistency with filter system
    console.log(`Project filter changed to: ${value}`);
    onProjectChange(value === 'all' ? null : value);
  };
  
  // If no client is selected or no projects are available, don't show the filter
  if (!selectedClient || (projects.length === 0 && !isLoading)) {
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
