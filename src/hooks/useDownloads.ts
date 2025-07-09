
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface DownloadRequest {
  id: string;
  imageId: string;
  imageSrc: string;
  imageTitle: string;
  requestDate: string;
  downloadUrl: string;
  status: 'pending' | 'ready' | 'expired' | 'processing' | 'failed';
  isHD: boolean;
  processedAt?: string;
  errorDetails?: string;
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchDownloads = async () => {
    if (!user) {
      console.log('No user found, skipping downloads fetch');
      setDownloads([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching downloads for user:', user.id);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('download_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching downloads:', fetchError);
        throw fetchError;
      }

      console.log('Raw downloads data:', data);

      if (data) {
        const formattedDownloads: DownloadRequest[] = data.map(item => ({
          id: item.id,
          imageId: item.image_id,
          imageSrc: item.image_src,
          imageTitle: item.image_title,
          requestDate: item.created_at,
          downloadUrl: item.download_url || '',
          status: item.status as DownloadRequest['status'],
          isHD: item.is_hd,
          processedAt: item.processed_at || undefined,
          errorDetails: item.error_details || undefined
        }));

        console.log('Formatted downloads:', formattedDownloads);
        setDownloads(formattedDownloads);
      } else {
        console.log('No downloads data returned');
        setDownloads([]);
      }
    } catch (err) {
      console.error('Error in fetchDownloads:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setDownloads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('useDownloads effect triggered, user:', user?.id);
    fetchDownloads();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for downloads');
    
    const channel = supabase
      .channel('download_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'download_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchDownloads(); // Refresh the data
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshDownloads = async () => {
    console.log('Manual refresh triggered');
    await fetchDownloads();
  };

  return {
    downloads,
    isLoading,
    error,
    refreshDownloads
  };
}
