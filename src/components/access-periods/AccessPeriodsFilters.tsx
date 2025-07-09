
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface Client {
  id: string;
  nom: string;
}

interface Project {
  id: string;
  nom_projet: string;
}

interface AccessPeriodsFiltersProps {
  selectedClientId: string | null;
  selectedProjectId: string | null;
  searchQuery: string;
  onClientChange: (clientId: string | null) => void;
  onProjectChange: (projectId: string | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function AccessPeriodsFilters({
  selectedClientId,
  selectedProjectId,
  searchQuery,
  onClientChange,
  onProjectChange,
  onSearchChange,
  onClearFilters
}: AccessPeriodsFiltersProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientsAndProjects();
  }, []);

  const fetchClientsAndProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, nom')
        .order('nom');

      if (clientsError) throw clientsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projets')
        .select('id, nom_projet')
        .order('nom_projet');

      if (projectsError) throw projectsError;

      setClients(clientsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching clients and projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = selectedClientId || selectedProjectId || searchQuery;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client filter */}
          <Select
            value={selectedClientId || "all"}
            onValueChange={(value) => onClientChange(value === "all" ? null : value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les clients" />
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

          {/* Project filter */}
          <Select
            value={selectedProjectId || "all"}
            onValueChange={(value) => onProjectChange(value === "all" ? null : value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nom_projet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Effacer les filtres
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedClientId && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Client: {clients.find(c => c.id === selectedClientId)?.nom}
                <button
                  onClick={() => onClientChange(null)}
                  className="hover:bg-primary/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {selectedProjectId && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Projet: {projects.find(p => p.id === selectedProjectId)?.nom_projet}
                <button
                  onClick={() => onProjectChange(null)}
                  className="hover:bg-primary/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {searchQuery && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Recherche: "{searchQuery}"
                <button
                  onClick={() => onSearchChange('')}
                  className="hover:bg-primary/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
