
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface DownloadRequest {
  id: string;
  user_id: string;
  image_id: string;
  image_title: string;
  image_src: string;
  download_url: string;
  is_hd: boolean;
  status: string;
  created_at: string;
  expires_at: string;
  processed_at?: string;
  error_details?: string;
  // Add mapped properties for compatibility
  imageId: string;
  imageSrc: string;
  imageTitle: string;
  requestDate: string;
  downloadUrl: string;
  isHD: boolean;
}

export const useDownloads = () => {
  const [downloads, setDownloads] = useState<DownloadRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const refreshDownloads = async () => {
    if (!user) {
      setDownloads([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('download_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching downloads:', fetchError);
        setError(new Error(fetchError.message));
      } else {
        // Map the data to include both original and expected properties
        const mappedDownloads = (data || []).map(item => ({
          ...item,
          imageId: item.image_id,
          imageSrc: item.image_src,
          imageTitle: item.image_title,
          requestDate: item.created_at,
          downloadUrl: item.download_url,
          isHD: item.is_hd
        }));
        setDownloads(mappedDownloads);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(new Error('Une erreur inattendue s\'est produite'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDownloads();
  }, [user]);

  // Set up real-time subscription for download updates
  useEffect(() => {
    if (!user) return;

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
        () => {
          refreshDownloads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    downloads,
    isLoading,
    error,
    refreshDownloads
  };
};
