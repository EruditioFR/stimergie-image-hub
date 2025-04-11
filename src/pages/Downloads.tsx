
import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/layout/Header';
import { DownloadsTable } from '@/components/downloads/DownloadsTable';
import { useDownloads } from '@/hooks/useDownloads';
import { AlertCircle, RefreshCw, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Footer } from '@/components/ui/layout/Footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { supabase, refreshSession } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

const Downloads = () => {
  const { downloads, isLoading, error, refreshDownloads } = useDownloads();
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialRefreshDone, setInitialRefreshDone] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [functionLogs, setFunctionLogs] = useState<Record<string, string[]>>({});
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (!error && data === true) {
          setIsAdmin(true);
        }
      } catch {
        // Silently fail
      }
    };
    
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    // Set up a channel subscription for downloads page presence and monitoring
    const downloadChannel = supabase.channel('download_page_presence', {
      config: {
        presence: {
          key: 'download_page',
        },
      }
    });
    
    // Set up the channel subscription with better logging
    const subscription = downloadChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('Realtime presence synchronized for downloads page');
        setRealtimeStatus('connected');
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('User joined downloads page:', key);
      })
      .on('system', { event: 'disconnect' }, () => {
        console.log('Realtime disconnected');
        setRealtimeStatus('disconnected');
        
        // Try to refresh the session when disconnected
        refreshSession().catch(err => {
          console.error('Failed to refresh session during disconnect:', err);
        });
      })
      .on('system', { event: 'reconnect' }, () => {
        console.log('Realtime reconnecting...');
        setRealtimeStatus('connecting');
      })
      .on('system', { event: 'connected' }, () => {
        console.log('Realtime connected');
        setRealtimeStatus('connected');
      })
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        
        // If subscription fails, try to refresh the session
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('Attempting to refresh session due to subscription error');
          await refreshSession();
        }
      });
    
    console.log('Realtime configured for downloads page');
    
    // Force a refresh when the component mounts - but only once
    if (!initialRefreshDone && !isLoading) {
      console.log('Performing initial refresh on Downloads page mount');
      refreshDownloads();
      setInitialRefreshDone(true);
    }
    
    return () => {
      // Cleanup when component unmounts
      console.log('Removing download page channel');
      supabase.removeChannel(downloadChannel);
    };
  }, [refreshDownloads, initialRefreshDone, isLoading]);

  // Debug logging - reducing frequency by only logging when downloads change
  useEffect(() => {
    if (downloads.length > 0 && !isLoading) {
      console.log('Downloads ready to render:', downloads.length);
      
      // Don't automatically refresh when we detect ready downloads without URLs
      // Instead, let the user manually refresh or use the refresh button in the table
    }
  }, [downloads, isLoading]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast.info('Actualisation des téléchargements...', { id: 'refresh-toast' });
    
    try {
      await refreshDownloads();
      toast.dismiss('refresh-toast');
      toast.success('Téléchargements actualisés');
    } catch (err) {
      toast.dismiss('refresh-toast');
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fonction pour afficher les logs des edge functions pour les admins
  const fetchEdgeFunctionLogs = async () => {
    if (!isAdmin) return;
    
    try {
      // Pour les besoins de la démo, nous simulons les logs
      // Dans une vraie application, vous pourriez avoir un endpoint admin pour cela
      setFunctionLogs({
        'generate-zip': [
          '[INFO] Processing ZIP request',
          '[DEBUG] Downloading 5 images',
          '[INFO] ZIP created successfully',
          '[INFO] Uploading to storage bucket: ZIP Downloads'
        ],
        'check-download-url': [
          '[INFO] Checking for pattern: images_20250411',
          '[DEBUG] Found 3 matching files',
          '[INFO] Selected file: images_20250411_123456.zip'
        ]
      });
      
      toast.success('Logs récupérés', {
        description: 'Logs des fonctions Edge mis à jour'
      });
    } catch (error) {
      console.error('Error fetching function logs:', error);
      toast.error('Erreur lors de la récupération des logs');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Vos téléchargements</h1>
              <p className="text-muted-foreground mt-2">
                Retrouvez ici toutes vos demandes de téléchargements.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Actualisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </>
              )}
            </Button>
          </div>

          {realtimeStatus !== 'connected' && (
            <Alert className="bg-amber-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>État de la connexion: {realtimeStatus === 'connecting' ? 'En cours de connexion' : 'Déconnecté'}</AlertTitle>
              <AlertDescription>
                {realtimeStatus === 'connecting' 
                  ? 'Connexion à Supabase en cours. Les mises à jour en temps réel seront bientôt disponibles.'
                  : 'La connexion temps réel est interrompue. Les mises à jour automatiques sont suspendues.'}
                <Button 
                  variant="link" 
                  onClick={handleManualRefresh} 
                  className="p-0 h-auto text-primary underline ml-2"
                  disabled={isRefreshing}
                >
                  Actualiser manuellement
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Section d'aide et débogage pour les administrateurs */}
          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Informations de débogage (administrateur)</h3>
                </div>
                <Button variant="ghost" size="sm">
                  {showDebugInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              
              {showDebugInfo && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">État du système</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium">Téléchargements:</span> {downloads.length}
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium">En attente:</span> {downloads.filter(d => d.status === 'pending').length}
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium">Prêts:</span> {downloads.filter(d => d.status === 'ready').length}
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium">Sans URL:</span> {
                          downloads.filter(d => d.status === 'ready' && !d.downloadUrl).length
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Logs des fonctions Edge</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={fetchEdgeFunctionLogs}
                        className="h-7 text-xs"
                      >
                        Récupérer les logs
                      </Button>
                    </div>
                    
                    {Object.keys(functionLogs).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(functionLogs).map(([funcName, logs]) => (
                          <div key={funcName} className="bg-white p-3 rounded border border-gray-200">
                            <h4 className="font-medium text-sm mb-1">{funcName}</h4>
                            <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                              {logs.join('\n')}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Cliquez sur "Récupérer les logs" pour afficher les informations des fonctions Edge</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des demandes</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  Une erreur est survenue lors du chargement des téléchargements.
                  <p className="text-sm mt-1">{error.message}</p>
                  <Button 
                    variant="link" 
                    onClick={handleManualRefresh} 
                    className="p-0 h-auto text-primary underline mt-2"
                    disabled={isRefreshing}
                  >
                    Essayer à nouveau
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <DownloadsTable downloads={downloads} onRefresh={handleManualRefresh} />
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Les liens de téléchargement sont disponibles pendant 7 jours après leur préparation. 
              La durée de préparation d'un fichier peut varier de quelques minutes à plusieurs heures selon la taille.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};

export default Downloads;
