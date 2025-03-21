
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientsData } from '@/hooks/projects/useClientsData';
import { Project } from '@/types/project';
import { ClientDB } from '@/types/user';
import { useProjectMutations } from '@/hooks/projects/useProjectMutations';
import { toast } from 'sonner';

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProjectForm = ({ project, onSuccess, onCancel }: ProjectFormProps) => {
  const isEditMode = !!project;
  
  const [formData, setFormData] = useState<Omit<Project, 'id' | 'created_at' | 'updated_at'>>(() => {
    if (project) return project;
    return {
      nom_projet: '',
      type_projet: '',
      id_client: '',
      nom_dossier: '',
    };
  });

  const [clients, setClients] = useState<ClientDB[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDB | null>(null);
  const { clients: fetchedClients, isLoading: isLoadingClients } = useClientsData();
  const { addProject, updateProject, isLoading } = useProjectMutations();

  // Update clients list when data is fetched
  useEffect(() => {
    if (fetchedClients && fetchedClients.length > 0) {
      // We're explicitly typing this as ClientDB[] to match the database structure
      setClients(fetchedClients as ClientDB[]);
      
      // If in edit mode, find the current client
      if (project && project.id_client) {
        const projectClient = fetchedClients.find(client => client.id === project.id_client);
        if (projectClient) {
          setSelectedClient(projectClient as ClientDB);
        }
      }
    }
  }, [fetchedClients, project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientChange = (clientId: string) => {
    setFormData(prev => ({
      ...prev,
      id_client: clientId
    }));

    // Update selectedClient for display purposes
    const client = clients.find(c => c.id === clientId);
    if (client) setSelectedClient(client);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert string values to numbers if needed
      const formattedData = {
        ...formData,
        // Make sure any number fields are properly converted
      };

      if (isEditMode && project) {
        await updateProject({ ...formattedData, id: project.id });
        toast.success('Projet mis à jour avec succès');
      } else {
        await addProject(formattedData);
        toast.success('Projet créé avec succès');
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error("Une erreur s'est produite");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Modifier le projet' : 'Créer un nouveau projet'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom_projet">Nom du projet</Label>
            <Input 
              id="nom_projet" 
              name="nom_projet" 
              value={formData.nom_projet} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_client">Client</Label>
            <Select 
              value={formData.id_client} 
              onValueChange={handleClientChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client">
                  {selectedClient ? selectedClient.nom : 'Sélectionner un client'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type_projet">Type de projet</Label>
            <Input 
              id="type_projet" 
              name="type_projet" 
              value={formData.type_projet} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom_dossier">Nom du dossier</Label>
            <Input 
              id="nom_dossier" 
              name="nom_dossier" 
              value={formData.nom_dossier} 
              onChange={handleChange} 
              required 
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Chargement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
