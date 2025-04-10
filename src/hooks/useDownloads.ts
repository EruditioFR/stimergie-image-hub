
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { DownloadRequest } from '@/components/downloads/DownloadsTable';

interface DownloadRequestData {
  id: string;
  user_id: string;
  image_id: string;
  image_title: string;
  image_src: string;
  created_at: string;
  expires_at: string;
  download_url: string;
  status: 'pending' | 'ready' | 'expired';
  is_hd: boolean;
}

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
        setError(null); // Reset any previous errors
        
        console.log('Fetching downloads for user:', user.id);
        
        // Use explicit type assertion to avoid TypeScript errors
        const { data, error } = await supabase
          .from('download_requests')
          .select('*')
          .eq('user_id', user.id) // Filter by user_id
          .order('created_at', { ascending: false }) as { data: DownloadRequestData[] | null, error: Error | null };
          
        if (error) {
          console.error('Error fetching downloads:', error);
          throw new Error(error.message);
        }
        
        console.log('Downloads data received:', data);
        
        if (!data || data.length === 0) {
          console.log('No downloads found for user');
          setDownloads([]);
          return;
        }
        
        // Check for expired downloads and mark them
        const now = new Date();
        const formattedData = data.map(item => ({
          id: item.id,
          imageId: item.image_id,
          imageSrc: item.image_src,
          imageTitle: item.image_title,
          requestDate: item.created_at,
          downloadUrl: item.download_url,
          status: new Date(item.expires_at) < now ? 'expired' : item.status as 'pending' | 'ready' | 'expired'
        }));
        
        console.log('Formatted downloads:', formattedData);
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
          table: 'download_requests',
          filter: `user_id=eq.${user.id}` // Listen only to changes for current user
        }, payload => {
          // When a new download is ready, add it to the list
          if (payload.new) {
            console.log('New download detected:', payload.new);
            // Type assertion to handle type errors
            const newItem = payload.new as unknown as DownloadRequestData;
            
            const newDownload: DownloadRequest = {
              id: newItem.id,
              imageId: newItem.image_id,
              imageSrc: newItem.image_src,
              imageTitle: newItem.image_title,
              requestDate: newItem.created_at,
              downloadUrl: newItem.download_url,
              status: newItem.status
            };
            
            setDownloads(prev => [newDownload, ...prev]);
          }
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'download_requests',
          filter: `user_id=eq.${user.id}` // Listen only to changes for current user
        }, payload => {
          // When a download status changes, update it in the list
          if (payload.new) {
            console.log('Download update detected:', payload.new);
            // Type assertion to handle type errors
            const updatedItem = payload.new as unknown as DownloadRequestData;
            
            setDownloads(prev => 
              prev.map(download => 
                download.id === updatedItem.id 
                  ? {
                      ...download,
                      status: updatedItem.status,
                      downloadUrl: updatedItem.download_url
                    }
                  : download
              )
            );
          }
        })
        .subscribe();
      
      console.log('Subscription to download_requests set up');
      
      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(downloadSubscription);
      };
    }
  }, [user]);

  return { downloads, isLoading, error };
}
