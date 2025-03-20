
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProjectFiltersProps {
  clients: { id: string; nom: string }[];
  clientFilter: string | null;
  onClientFilterChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export function ProjectFilters({
  clients,
  clientFilter,
  onClientFilterChange,
  searchQuery,
  onSearchQueryChange
}: ProjectFiltersProps) {
  const [projectOptions, setProjectOptions] = useState<{id: string, name: string}[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Effet pour réinitialiser les options et la sélection quand le client change
  useEffect(() => {
    setProjectOptions([]);
    setSelectedOption(null);
    onSearchQueryChange("");
  }, [clientFilter, onSearchQueryChange]);

  // Charger les projets depuis la base de données pour le client sélectionné
  useEffect(() => {
    const fetchProjects = async () => {
      if (!clientFilter) {
        setProjectOptions([]);
        return;
      }
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('projets')
          .select('id, nom_projet')
          .eq('id_client', clientFilter)
          .order('nom_projet');
          
        if (error) {
          console.error("Erreur lors de la récupération des projets:", error);
          throw error;
        }
        
        if (data) {
          const projects = data.map(project => ({
            id: project.id,
            name: project.nom_projet
          }));
          setProjectOptions(projects);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [clientFilter]);

  // Gestion du changement de projet sélectionné
  const handleProjectChange = (value: string) => {
    setSelectedOption(value);
    onSearchQueryChange(value);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <Select
            value={clientFilter || "all"}
            onValueChange={(value) => onClientFilterChange(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-2/3">
          {clientFilter ? (
            // Si un client est sélectionné, montrer un select avec les projets de ce client
            <div>
              {loading ? (
                <div className="flex items-center justify-center h-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <Select
                  value={selectedOption || ""}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un projet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.length === 0 ? (
                      <SelectItem value="no-projects" disabled>
                        Aucun projet pour ce client
                      </SelectItem>
                    ) : (
                      projectOptions.map((project) => (
                        <SelectItem key={project.id} value={project.id} className="break-words">
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            // Si aucun client n'est sélectionné, montrer le champ de recherche normal
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
