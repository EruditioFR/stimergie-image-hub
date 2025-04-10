
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
    const fetchDownloads = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('download_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw new Error(error.message);
        
        // Check for expired downloads and mark them
        const now = new Date();
        const formattedData = data.map(item => ({
          id: item.id,
          imageId: item.image_id,
          imageSrc: item.image_src,
          imageTitle: item.image_title,
          requestDate: item.created_at,
          downloadUrl: item.download_url,
          status: new Date(item.expires_at) < now ? 'expired' : item.status
        }));
        
        setDownloads(formattedData);
        
      } catch (err) {
        console.error('Erreur lors du chargement des téléchargements:', err);
        setError(err instanceof Error ? err : new Error('Une erreur inconnue est survenue'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDownloads();
      
      // Set up a subscription to receive real-time updates
      const downloadSubscription = supabase
        .channel('table-db-changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'download_requests'
        }, payload => {
          // When a new download is ready, add it to the list
          if (payload.new && payload.new.user_id === user.id) {
            const newDownload: DownloadRequest = {
              id: payload.new.id,
              imageId: payload.new.image_id,
              imageSrc: payload.new.image_src,
              imageTitle: payload.new.image_title,
              requestDate: payload.new.created_at,
              downloadUrl: payload.new.download_url,
              status: payload.new.status
            };
            
            setDownloads(prev => [newDownload, ...prev]);
          }
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'download_requests'
        }, payload => {
          // When a download status changes, update it in the list
          if (payload.new && payload.new.user_id === user.id) {
            setDownloads(prev => 
              prev.map(download => 
                download.id === payload.new.id 
                  ? {
                      ...download,
                      status: payload.new.status,
                      downloadUrl: payload.new.download_url
                    }
                  : download
              )
            );
          }
        })
        .subscribe();
      
      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(downloadSubscription);
      };
    }
  }, [user]);

  return { downloads, isLoading, error };
}
