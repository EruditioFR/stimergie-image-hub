/**
 * Access Debug Info Component  
 * Shows detailed access information to debug project visibility issues
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, CheckCircle, Database, Clock } from 'lucide-react';

interface AccessPeriod {
  project_id: string;
  client_id: string;
  access_start: string;
  access_end: string;
  is_active: boolean;
}

interface ProjectInfo {
  id: string;
  nom_projet: string;
  id_client: string;
  client_name?: string;
}

export const AccessDebugInfo = () => {
  const { user } = useAuth();
  const [accessPeriods, setAccessPeriods] = useState<AccessPeriod[]>([]);
  const [projectsInfo, setProjectsInfo] = useState<ProjectInfo[]>([]);
  const [directClientProjects, setDirectClientProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [userClientId, setUserClientId] = useState<string | null>(null);

  const debugAccess = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Starting access debug for user:', user.id);

      // 1. Get user client ID
      const { data: clientId } = await supabase.rpc('get_user_client_id', { user_id: user.id });
      setUserClientId(clientId);

      // 2. Get accessible projects via RLS function
      const { data: accessibleProjects } = await supabase
        .rpc('get_accessible_projects', {
          user_id: user.id,
          check_time: new Date().toISOString()
        });

      const projectIds = accessibleProjects?.map(item => item.project_id) || [];
      console.log('📋 Accessible project IDs:', projectIds);

      // 3. Get project details for accessible projects
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projets')
          .select('id, nom_projet, id_client, clients:id_client(nom)')
          .in('id', projectIds);
        
        const projectsWithClientName = projects?.map(p => ({
          id: p.id,
          nom_projet: p.nom_projet,
          id_client: p.id_client,
          client_name: (p.clients as any)?.nom
        })) || [];
        
        setProjectsInfo(projectsWithClientName);
      }

      // 4. Try direct client query (this should fail for non-admin users)
      if (clientId) {
        const { data: directProjects, error: directError } = await supabase
          .from('projets')
          .select('id, nom_projet, id_client, clients:id_client(nom)')
          .eq('id_client', clientId);

        console.log('📊 Direct client projects query result:', directProjects?.length || 0, 'Error:', directError);
        
        if (directProjects && directError === null) {
          const directProjectsWithClientName = directProjects.map(p => ({
            id: p.id,
            nom_projet: p.nom_projet,
            id_client: p.id_client,
            client_name: (p.clients as any)?.nom
          }));
          setDirectClientProjects(directProjectsWithClientName);
        } else {
          setDirectClientProjects([]);
        }
      }

      // 5. Get access periods for this user's client
      if (clientId) {
        const { data: periods } = await supabase
          .from('project_access_periods')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true);
        
        setAccessPeriods(periods || []);
      }

    } catch (error) {
      console.error('❌ Error debugging access:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAccessActive = (period: AccessPeriod): boolean => {
    const now = new Date();
    const start = new Date(period.access_start);
    const end = new Date(period.access_end);
    return now >= start && now <= end && period.is_active;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnostic d'Accès aux Projets
          <Badge variant="outline">
            User: {userClientId?.slice(-8)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Analyse détaillée des droits d'accès pour résoudre les problèmes de visibilité des images
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Button onClick={debugAccess} disabled={loading}>
            {loading ? 'Analyse en cours...' : 'Analyser les Accès'}
          </Button>

          {(projectsInfo.length > 0 || directClientProjects.length > 0 || accessPeriods.length > 0) && (
            <>
              {/* Access Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{projectsInfo.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Projets Accessibles (via RLS)
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{directClientProjects.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Projets Directs Client
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{accessPeriods.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Périodes d'Accès Actives
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Accessible Projects */}
              {projectsInfo.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Projets Accessibles via RLS
                  </h3>
                  <div className="space-y-2">
                    {projectsInfo.map(project => (
                      <div key={project.id} className="p-3 bg-white rounded border">
                        <div className="font-medium">{project.nom_projet}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {project.id}
                        </div>
                        <div className="text-sm">
                          Client: {project.client_name} ({project.id_client})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Client Projects */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {directClientProjects.length === 0 ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  Projets Directs du Client
                </h3>
                {directClientProjects.length === 0 ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-red-800 font-medium">
                      ❌ Aucun projet trouvé avec id_client = {userClientId}
                    </div>
                    <div className="text-red-600 text-sm mt-1">
                      Ceci explique pourquoi les requêtes directes sur projets retournent [].
                      L'utilisateur a accès aux projets via les périodes d'accès, pas via l'ownership direct.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {directClientProjects.map(project => (
                      <div key={project.id} className="p-3 bg-white rounded border">
                        <div className="font-medium">{project.nom_projet}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {project.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Access Periods */}
              {accessPeriods.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Périodes d'Accès Configurées
                  </h3>
                  <div className="space-y-2">
                    {accessPeriods.map((period, index) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Projet: {period.project_id.slice(-8)}</div>
                          <Badge variant={isAccessActive(period) ? 'default' : 'secondary'}>
                            {isAccessActive(period) ? 'ACTIF' : 'INACTIF'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Du {formatDate(period.access_start)} au {formatDate(period.access_end)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">
                  💡 Explication du Problème
                </h3>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>
                    L'utilisateur <code>{user?.email}</code> a accès aux projets via les 
                    <strong> périodes d'accès</strong>, pas par ownership direct du client.
                  </p>
                  <p>
                    C'est pourquoi <code>get_accessible_projects()</code> retourne {projectsInfo.length} projets
                    mais les requêtes directes avec <code>id_client</code> retournent {directClientProjects.length}.
                  </p>
                  <p className="font-medium">
                    ✅ La correction consiste à utiliser <code>get_accessible_projects()</code> 
                    partout au lieu de filtrer par <code>id_client</code> directement.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};