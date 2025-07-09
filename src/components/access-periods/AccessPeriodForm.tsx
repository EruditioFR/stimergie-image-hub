
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AccessPeriod } from './ProjectAccessPeriods';

interface Client {
  id: string;
  nom: string;
}

interface Project {
  id: string;
  nom_projet: string;
  id_client: string;
}

interface AccessPeriodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPeriod?: AccessPeriod | null;
}

export function AccessPeriodForm({ isOpen, onClose, onSuccess, editingPeriod }: AccessPeriodFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [accessStart, setAccessStart] = useState('');
  const [accessEnd, setAccessEnd] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (editingPeriod) {
      setSelectedClientId(editingPeriod.client_id);
      setSelectedProjectId(editingPeriod.project_id);
      setAccessStart(new Date(editingPeriod.access_start).toISOString().slice(0, 16));
      setAccessEnd(new Date(editingPeriod.access_end).toISOString().slice(0, 16));
      setIsActive(editingPeriod.is_active);
    } else {
      resetForm();
    }
  }, [editingPeriod]);

  useEffect(() => {
    if (selectedClientId) {
      fetchProjectsForClient(selectedClientId);
    } else {
      setProjects([]);
      setSelectedProjectId('');
    }
  }, [selectedClientId]);

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedProjectId('');
    setAccessStart('');
    setAccessEnd('');
    setIsActive(true);
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom')
        .order('nom');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjectsForClient = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('projets')
        .select('id, nom_projet, id_client')
        .eq('id_client', clientId)
        .order('nom_projet');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId || !selectedProjectId || !accessStart || !accessEnd) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    if (new Date(accessStart) >= new Date(accessEnd)) {
      toast({
        title: 'Erreur',
        description: 'La date de fin doit être postérieure à la date de début',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const accessPeriodData = {
        project_id: selectedProjectId,
        client_id: selectedClientId,
        access_start: new Date(accessStart).toISOString(),
        access_end: new Date(accessEnd).toISOString(),
        is_active: isActive,
        created_by: user?.id
      };

      let error;
      if (editingPeriod) {
        const { error: updateError } = await supabase
          .from('project_access_periods')
          .update(accessPeriodData)
          .eq('id', editingPeriod.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('project_access_periods')
          .insert([accessPeriodData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Période d'accès ${editingPeriod ? 'modifiée' : 'créée'} avec succès`
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving access period:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la période d\'accès',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPeriod ? 'Modifier la période d\'accès' : 'Nouvelle période d\'accès'}
          </DialogTitle>
          <DialogDescription>
            Définissez les droits d'accès pour un projet et un client spécifiques
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Projet *</Label>
            <Select 
              value={selectedProjectId} 
              onValueChange={setSelectedProjectId}
              disabled={!selectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.nom_projet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accessStart">Date de début *</Label>
              <Input
                id="accessStart"
                type="datetime-local"
                value={accessStart}
                onChange={(e) => setAccessStart(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessEnd">Date de fin *</Label>
              <Input
                id="accessEnd"
                type="datetime-local"
                value={accessEnd}
                onChange={(e) => setAccessEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Période active</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (editingPeriod ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
