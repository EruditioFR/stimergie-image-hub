
import { useState, useEffect, useCallback } from 'react';
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

  // Function to convert DB format to component format
  const formatDownload = useCallback((item: DownloadRequestData): DownloadRequest => {
    console.log(`Formatting download ${item.id}, status: ${item.status}, URL: ${item.download_url ? 'present' : 'missing'}`);
    
    return {
      id: item.id,
      imageId: item.image_id,
      imageSrc: item.image_src,
      imageTitle: item.image_title,
      requestDate: item.created_at,
      downloadUrl: item.download_url || '', // Ensure we have at least an empty string
      status: item.status as 'pending' | 'ready' | 'expired'
    };
  }, []);

  // Function to fetch downloads
  const fetchDownloads = useCallback(async () => {
    if (!user) {
      setDownloads([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null); // Reset any previous errors
      
      console.log('Fetching downloads for user:', user.id);
      
      const { data, error } = await supabase
        .from('download_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching downloads:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }
      
      console.log('Downloads data received:', data);
      
      if (!data || data.length === 0) {
        console.log('No downloads found for user');
        setDownloads([]);
        setIsLoading(false);
        return;
      }
      
      // Format the data for the UI
      const formattedData = data.map(item => formatDownload(item as DownloadRequestData));
      
      console.log('Formatted downloads:', formattedData);
      setDownloads(formattedData);
      
    } catch (err) {
      console.error('Error loading downloads:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [user, formatDownload]);

  // Function to refresh downloads on demand
  const refreshDownloads = useCallback(() => {
    if (user) {
      console.log('Manually refreshing downloads');
      fetchDownloads();
    }
  }, [user, fetchDownloads]);

  useEffect(() => {
    if (user) {
      fetchDownloads();
      
      // Set up a subscription to receive real-time updates
      const downloadSubscription = supabase
        .channel('download-requests-changes')
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
            
            const newDownload = formatDownload(newItem);
            console.log('New download formatted:', newDownload);
            
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
            
            console.log(`Updating download ${updatedItem.id} with new status: ${updatedItem.status} and URL: ${updatedItem.download_url || 'empty'}`);
            
            setDownloads(prev => 
              prev.map(download => 
                download.id === updatedItem.id 
                  ? {
                      ...download,
                      status: updatedItem.status,
                      downloadUrl: updatedItem.download_url || '', // Ensure we have at least an empty string
                      imageTitle: updatedItem.image_title
                    }
                  : download
              )
            );
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
      
      console.log('Subscription to download_requests set up');
      
      // Cleanup subscription on unmount
      return () => {
        console.log('Cleaning up download_requests subscription');
        supabase.removeChannel(downloadSubscription);
      };
    }
  }, [user, formatDownload, fetchDownloads]);

  return { downloads, isLoading, error, refreshDownloads };
}
