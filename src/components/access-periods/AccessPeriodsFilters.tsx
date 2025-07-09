
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
  id_client: string;
}

interface AccessPeriodsFiltersProps {
  selectedClientId: string | null;
  selectedProjectId: string | null;
  selectedActiveStatus: boolean | null;
  searchQuery: string;
  onClientChange: (clientId: string | null) => void;
  onProjectChange: (projectId: string | null) => void;
  onActiveStatusChange: (isActive: boolean | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function AccessPeriodsFilters({
  selectedClientId,
  selectedProjectId,
  selectedActiveStatus,
  searchQuery,
  onClientChange,
  onProjectChange,
  onActiveStatusChange,
  onSearchChange,
  onClearFilters
}: AccessPeriodsFiltersProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
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
        .select('id, nom_projet, id_client')
        .order('nom_projet');

      if (projectsError) throw projectsError;

      setClients(clientsData || []);
      setAllProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching clients and projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on selected client
  const filteredProjects = selectedClientId 
    ? allProjects.filter(project => project.id_client === selectedClientId)
    : allProjects;

  // Filter clients based on selected project
  const filteredClients = selectedProjectId
    ? clients.filter(client => {
        const project = allProjects.find(p => p.id === selectedProjectId);
        return project ? client.id === project.id_client : true;
      })
    : clients;

  const handleClientChange = (value: string) => {
    const clientId = value === "all" ? null : value;
    onClientChange(clientId);
    
    // If a client is selected and the current project doesn't belong to this client, clear project selection
    if (clientId && selectedProjectId) {
      const currentProject = allProjects.find(p => p.id === selectedProjectId);
      if (currentProject && currentProject.id_client !== clientId) {
        onProjectChange(null);
      }
    }
  };

  const handleProjectChange = (value: string) => {
    const projectId = value === "all" ? null : value;
    onProjectChange(projectId);
    
    // If a project is selected and the current client doesn't match, update client selection
    if (projectId && selectedClientId) {
      const selectedProject = allProjects.find(p => p.id === projectId);
      if (selectedProject && selectedProject.id_client !== selectedClientId) {
        onClientChange(selectedProject.id_client);
      }
    }
  };

  const handleActiveStatusChange = (value: string) => {
    if (value === "all") {
      onActiveStatusChange(null);
    } else {
      onActiveStatusChange(value === "active");
    }
  };

  const hasActiveFilters = selectedClientId || selectedProjectId || selectedActiveStatus !== null || searchQuery;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            onValueChange={handleClientChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {filteredClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Project filter */}
          <Select
            value={selectedProjectId || "all"}
            onValueChange={handleProjectChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {filteredProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nom_projet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active status filter */}
          <Select
            value={selectedActiveStatus === null ? "all" : selectedActiveStatus ? "active" : "inactive"}
            onValueChange={handleActiveStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="inactive">Inactives</SelectItem>
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
                Projet: {allProjects.find(p => p.id === selectedProjectId)?.nom_projet}
                <button
                  onClick={() => onProjectChange(null)}
                  className="hover:bg-primary/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {selectedActiveStatus !== null && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Statut: {selectedActiveStatus ? 'Actives' : 'Inactives'}
                <button
                  onClick={() => onActiveStatusChange(null)}
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
