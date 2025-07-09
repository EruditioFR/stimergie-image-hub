import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users } from 'lucide-react';
import { AccessPeriodForm } from './AccessPeriodForm';
import { AccessPeriodsList } from './AccessPeriodsList';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AccessPeriod {
  id: string;
  project_id: string;
  client_id: string;
  access_start: string;
  access_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  project_name?: string;
  client_name?: string;
}

export function ProjectAccessPeriods() {
  const [accessPeriods, setAccessPeriods] = useState<AccessPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AccessPeriod | null>(null);
  const { userRole, isAdmin } = useAuth();
  const { toast } = useToast();

  // Seuls les admins peuvent gérer les périodes d'accès
  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    );
  }

  useEffect(() => {
    fetchAccessPeriods();
  }, []);

  const fetchAccessPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_access_periods')
        .select(`
          *,
          projets:project_id (nom_projet),
          clients:client_id (nom)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(period => ({
        ...period,
        project_name: period.projets?.nom_projet,
        client_name: period.clients?.nom
      })) || [];

      // Trier par nom du client puis par nom du projet (alphabétique)
      const sortedData = formattedData.sort((a, b) => {
        // Tri principal par nom du client
        const clientComparison = (a.client_name || '').localeCompare(b.client_name || '', 'fr', { 
          sensitivity: 'base' 
        });
        
        if (clientComparison !== 0) {
          return clientComparison;
        }
        
        // Tri secondaire par nom du projet
        return (a.project_name || '').localeCompare(b.project_name || '', 'fr', { 
          sensitivity: 'base' 
        });
      });

      setAccessPeriods(sortedData);
    } catch (error) {
      console.error('Error fetching access periods:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les périodes d\'accès',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = () => {
    setEditingPeriod(null);
    setShowForm(true);
  };

  const handleEditPeriod = (period: AccessPeriod) => {
    setEditingPeriod(period);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPeriod(null);
    fetchAccessPeriods();
  };

  const handleToggleActive = async (periodId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('project_access_periods')
        .update({ is_active: !isActive })
        .eq('id', periodId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Période d'accès ${!isActive ? 'activée' : 'désactivée'}`
      });

      fetchAccessPeriods();
    } catch (error) {
      console.error('Error toggling period:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la période d\'accès',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    try {
      const { error } = await supabase
        .from('project_access_periods')
        .delete()
        .eq('id', periodId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Période d\'accès supprimée'
      });

      fetchAccessPeriods();
    } catch (error) {
      console.error('Error deleting period:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la période d\'accès',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des droits d'accès</h2>
          <p className="text-muted-foreground">
            Gérez les périodes d'accès aux projets pour les clients
          </p>
        </div>
        <Button onClick={handleCreatePeriod} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle période
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des périodes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessPeriods.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Périodes actives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accessPeriods.filter(p => p.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients concernés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(accessPeriods.map(p => p.client_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <AccessPeriodForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
          editingPeriod={editingPeriod}
        />
      )}

      <AccessPeriodsList
        accessPeriods={accessPeriods}
        onEdit={handleEditPeriod}
        onToggleActive={handleToggleActive}
        onDelete={handleDeletePeriod}
      />
    </div>
  );
}
