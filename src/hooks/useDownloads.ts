
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { DownloadRequest } from '@/components/downloads/DownloadsTable';

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Cette fonction sera implémentée plus tard quand la fonctionnalité
    // de téléchargement sera disponible. Pour le moment, elle simule un chargement.
    const fetchDownloads = async () => {
      try {
        setIsLoading(true);
        
        // Simulation d'un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dans le futur, ceci sera remplacé par un vrai appel API
        /*
        const { data, error } = await supabase
          .from('download_requests')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const formattedData = data.map(item => ({
          id: item.id,
          imageId: item.image_id,
          imageSrc: item.image_src,
          imageTitle: item.image_title,
          requestDate: item.created_at,
          downloadUrl: item.download_url,
          status: item.status
        }));
        
        setDownloads(formattedData);
        */
        
        // Pour le moment, on n'utilise pas de vraies données
        setDownloads([]);
        
      } catch (err) {
        console.error('Erreur lors du chargement des téléchargements:', err);
        setError(err instanceof Error ? err : new Error('Une erreur inconnue est survenue'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDownloads();
    }
  }, [user]);

  return { downloads, isLoading, error };
}
