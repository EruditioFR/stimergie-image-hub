
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

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
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Effet pour réinitialiser les options et la sélection quand le client change
  useEffect(() => {
    setProjectOptions([]);
    setSelectedOption(null);
    onSearchQueryChange("");
  }, [clientFilter, onSearchQueryChange]);

  // Simuler le chargement des options de projet basées sur le client sélectionné
  useEffect(() => {
    if (clientFilter) {
      // Ici on pourrait charger les options depuis l'API
      // Pour l'instant, on utilise des options fictives selon le client
      const selectedClient = clients.find(c => c.id === clientFilter);
      if (selectedClient) {
        const options = [
          `${selectedClient.nom} - Projet 1`,
          `${selectedClient.nom} - Projet 2`,
          `${selectedClient.nom} - Projet 3`
        ];
        setProjectOptions(options);
      }
    } else {
      // Si aucun client n'est sélectionné, réinitialiser les options
      setProjectOptions([]);
    }
  }, [clientFilter, clients]);

  // Gestion du changement d'option
  const handleOptionChange = (value: string) => {
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
            // Si un client est sélectionné, montrer un select avec les options de projet
            <Select
              value={selectedOption || ""}
              onValueChange={handleOptionChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un projet..." />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
