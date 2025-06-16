
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
}

export const useDownloads = () => {
  const [downloads, setDownloads] = useState<DownloadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDownloads = async () => {
    if (!user) {
      setDownloads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('download_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching downloads:', fetchError);
        setError(fetchError.message);
      } else {
        setDownloads(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
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
          fetchDownloads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    downloads,
    loading,
    error,
    refetch: fetchDownloads
  };
};
