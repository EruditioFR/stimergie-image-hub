
import React, { useEffect } from 'react';
import Header from '@/components/ui/layout/Header';
import { DownloadsTable } from '@/components/downloads/DownloadsTable';
import { useDownloads } from '@/hooks/useDownloads';
import { Loader2, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/ui/layout/Footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const Downloads = () => {
  const { downloads, isLoading, error } = useDownloads();

  useEffect(() => {
    // Enable row-level changes for this session 
    // This helps ensure Realtime changes are properly received
    const enableRealtimeForTable = async () => {
      try {
        const { error } = await supabase.realtime.setConfig({
          presence: { key: 'download_page' },
        });
        
        if (error) {
          console.error('Error setting realtime config:', error);
        } else {
          console.log('Realtime configured for downloads page');
        }
      } catch (err) {
        console.error('Error configuring realtime:', err);
      }
    };
    
    enableRealtimeForTable();
    
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Vos téléchargements</h1>
            <p className="text-muted-foreground mt-2">
              Retrouvez ici toutes vos demandes de téléchargements.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des demandes</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Chargement des téléchargements...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  Une erreur est survenue lors du chargement des téléchargements.
                  <p className="text-sm mt-1">{error.message}</p>
                </AlertDescription>
              </Alert>
            ) : (
              <DownloadsTable downloads={downloads} />
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
