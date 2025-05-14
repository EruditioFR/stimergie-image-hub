
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, refreshSession } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { DownloadRequest } from '@/components/downloads/DownloadsTable';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DownloadRequestData {
  id: string;
  user_id: string;
  image_id: string;
  image_title: string;
  image_src: string;
  created_at: string;
  expires_at: string;
  download_url: string;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'expired';
  is_hd: boolean;
  processed_at?: string;
  error_details?: string;
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const hasInitialFetchRef = useRef(false);
  const isMountedRef = useRef(true);
  
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
      status: item.status as 'pending' | 'ready' | 'expired' | 'processing' | 'failed',
      isHD: item.is_hd, // Map the is_hd field from the database to isHD in our interface
      processedAt: item.processed_at, // Add the processed_at field
      errorDetails: item.error_details // Add the error_details field
    };
  }, []);

  // Function to fetch downloads with retry logic
  const fetchDownloads = useCallback(async (retryAttempt = 0) => {
    // Guard to prevent fetch when unmounted
    if (!isMountedRef.current) return;
    
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
        
        // Handle JWT/auth errors
        if (error.message.includes('JWT') || error.code === '401') {
          console.log('Authentication error, trying to refresh session');
          const refreshed = await refreshSession();
          
          // If refreshed successfully, retry the fetch
          if (refreshed && retryAttempt < 3 && isMountedRef.current) {
            console.log(`Retrying fetch after session refresh (attempt ${retryAttempt + 1})`);
            // Clear any existing timeout
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            
            // Set a small delay before retry
            fetchTimeoutRef.current = setTimeout(() => {
              fetchDownloads(retryAttempt + 1);
            }, 1000);
            return;
          }
        }
        
        throw new Error(error.message);
      }
      
      console.log('Downloads data received:', data);
      retryCountRef.current = 0; // Reset retry counter on success
      hasInitialFetchRef.current = true;
      
      if (!isMountedRef.current) return; // Early return if unmounted during async operation
      
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
      
      // Important: Always set isLoading to false after data is processed, regardless of data state
      setIsLoading(false);
      
    } catch (err) {
      if (!isMountedRef.current) return; // Early return if unmounted during error handling
      
      console.error('Error loading downloads:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // Implement retry with backoff if appropriate
      if (retryAttempt < 3 && isMountedRef.current) {
        const backoffTime = Math.pow(2, retryAttempt) * 1000;
        console.log(`Will retry fetching downloads in ${backoffTime}ms (attempt ${retryAttempt + 1})`);
        
        // Clear any existing timeout
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        
        // Set timeout for retry with backoff
        fetchTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchDownloads(retryAttempt + 1);
          }
        }, backoffTime);
      } else {
        // After multiple retries, show user-facing error
        toast.error('Erreur de connexion', {
          description: 'Impossible de récupérer vos téléchargements. Veuillez réessayer plus tard.'
        });
        
        // Important: Set isLoading to false even in case of error after retries
        setIsLoading(false);
      }
    }
  }, [user, formatDownload]);

  // Function to refresh downloads on demand with connection error handling
  const refreshDownloads = useCallback(async () => {
    if (!user || !isMountedRef.current) return;
    
    console.log('Manually refreshing downloads');
    
    // Check for existing subscription and recreate if needed
    if (!subscriptionRef.current) {
      setupRealtimeSubscription();
    }
    
    await fetchDownloads();
  }, [user, fetchDownloads]);

  // Setup the realtime subscription with better error handling
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !isMountedRef.current) return null;
    
    try {
      console.log('Setting up download-requests-changes subscription');
      
      // Clear any existing subscription first
      if (subscriptionRef.current) {
        console.log('Removing existing download-requests subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      // Create new subscription
      const downloadSubscription = supabase
        .channel('download-requests-changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'download_requests',
          filter: `user_id=eq.${user.id}` // Listen only to changes for current user
        }, payload => {
          if (!isMountedRef.current) return; // Skip if component unmounted
          
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
          if (!isMountedRef.current) return; // Skip if component unmounted
          
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
            
            // If a download becomes ready, show a notification
            const existingDownload = downloads.find(d => d.id === updatedItem.id);
            if (existingDownload?.status !== 'ready' && updatedItem.status === 'ready') {
              toast.success('Téléchargement prêt', {
                description: `${updatedItem.image_title} est prêt à être téléchargé`
              });
            }
          }
        })
        .on('system', { event: 'disconnect' }, () => {
          console.log('Realtime disconnected for downloads subscription');
          
          // Queue reconnection attempt, but don't refresh
          if (isMountedRef.current) {
            setTimeout(() => {
              console.log('Attempting to recreate downloads subscription after disconnect');
              if (isMountedRef.current) setupRealtimeSubscription();
            }, 3000);
          }
        })
        .subscribe((status) => {
          console.log('Download subscription status:', status);
          
          // Handle subscription errors - using the correct status values
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Subscription error: ${status}`);
            
            // Try to refresh the session
            refreshSession().then(() => {
              // After refreshing, setup subscription again
              if (isMountedRef.current) {
                setTimeout(() => {
                  console.log('Retrying subscription setup after session refresh');
                  if (isMountedRef.current) setupRealtimeSubscription();
                }, 1000);
              }
            });
          }
        });
      
      console.log('Subscription to download_requests set up');
      subscriptionRef.current = downloadSubscription;
      return downloadSubscription;
    } catch (err) {
      console.error('Failed to set up realtime subscription:', err);
      return null;
    }
  }, [user, formatDownload, downloads]);

  // Initial setup - with protection against multiple fetches
  useEffect(() => {
    isMountedRef.current = true;  // Mark as mounted
    
    if (user && !hasInitialFetchRef.current) {
      console.log('Initial setup in useDownloads');
      fetchDownloads();
      const subscription = setupRealtimeSubscription();
    }
    
    // Cleanup on unmount
    return () => {
      console.log('Cleaning up download_requests subscription');
      isMountedRef.current = false;  // Mark as unmounted
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (subscriptionRef.current) {
        console.log('Removing subscription on unmount');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, fetchDownloads, setupRealtimeSubscription]);

  return { downloads, isLoading, error, refreshDownloads };
}
