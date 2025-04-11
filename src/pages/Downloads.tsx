
import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/layout/Header';
import { DownloadsTable } from '@/components/downloads/DownloadsTable';
import { useDownloads } from '@/hooks/useDownloads';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Footer } from '@/components/ui/layout/Footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { supabase, refreshSession } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

const Downloads = () => {
  const { downloads, isLoading, error, refreshDownloads } = useDownloads();
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialRefreshDone, setInitialRefreshDone] = useState(false);

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
