
import { useState, useEffect } from 'react';
import { supabase, refreshSession, reconnectRealtime } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useRealtimeStatus() {
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  useEffect(() => {
    console.log('Setting up Realtime connection for downloads page');
    
    // Set up a channel subscription for downloads page presence and monitoring
    const downloadChannel = supabase.channel('download_page_presence', {
      config: {
        presence: {
          key: 'download_page',
        },
        broadcast: {
          self: true
        }
      }
    });
    
    // Set up the channel subscription with robust error handling and reconnection
    const subscription = downloadChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('Realtime presence synchronized for downloads page');
        setRealtimeStatus('connected');
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('User joined downloads page:', key);
      })
      .on('system', { event: 'disconnect' }, (payload) => {
        console.log('Realtime disconnected:', payload);
        setRealtimeStatus('disconnected');
        
        // Try to refresh the session when disconnected
        refreshSession().catch(err => {
          console.error('Failed to refresh session during disconnect:', err);
        });
      })
      .on('system', { event: 'reconnect' }, () => {
        console.log('Realtime reconnecting...');
        setRealtimeStatus('connecting');
        setReconnectAttempts(prev => prev + 1);
      })
      .on('system', { event: 'connected' }, () => {
        console.log('Realtime connected');
        setRealtimeStatus('connected');
        setLastConnectedAt(new Date());
        
        // Reset reconnect attempts counter on successful connection
        if (reconnectAttempts > 0) {
          setReconnectAttempts(0);
        }
      })
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        
        // If subscription fails or times out, try to refresh the session
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('Attempting to refresh session due to subscription error');
          await refreshSession();
          
          // Show a toast notification about the connection issue
          toast.warning('Reconnexion en cours...', {
            description: 'Tentative de reconnexion au service de téléchargement.',
            duration: 3000
          });
        } else if (status === 'SUBSCRIBED') {
          // Proactively enter presence when subscribed
          try {
            await downloadChannel.track({
              online: true,
              last_seen_at: new Date().toISOString()
            });
            console.log('Presence tracking active');
            
            // Also add a listener for download_requests table changes
            const downloadRequestsChannel = supabase.channel('public:download_requests')
              .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'download_requests' }, 
                (payload) => {
                  console.log('Download request changed:', payload);
                  // You could dispatch an action here or use a callback
                })
              .subscribe();
            
            // Clean up this channel when the main channel is removed
            return () => {
              supabase.removeChannel(downloadRequestsChannel);
            };
            
          } catch (error) {
            console.error('Failed to track presence:', error);
          }
        }
      });
    
    console.log('Realtime configured for downloads page');
    
    // Set up a ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (realtimeStatus === 'connected') {
        try {
          // Update presence data to keep connection alive
          downloadChannel.track({
            online: true,
            last_ping: new Date().toISOString()
          }).catch(err => console.error('Presence ping failed:', err));
        } catch (error) {
          console.error('Error during ping interval:', error);
        }
      } else if (realtimeStatus === 'disconnected' && reconnectAttempts < 5) {
        // Attempt to manually reconnect if disconnected
        console.log('Attempting manual reconnection...');
        reconnectRealtime().catch(err => {
          console.error('Manual reconnect failed:', err);
        });
      }
    }, 30000); // Ping every 30 seconds
    
    return () => {
      // Cleanup when component unmounts
      console.log('Removing download page channel');
      clearInterval(pingInterval);
      supabase.removeChannel(downloadChannel);
    };
  }, [reconnectAttempts]); // Add reconnectAttempts as dependency to recreate channel after multiple failures
  
  // Add a manual reconnect function
  const manualReconnect = async () => {
    setRealtimeStatus('connecting');
    try {
      await reconnectRealtime();
      toast.success('Reconnexion initiée', {
        description: 'Tentative de reconnexion au service en cours...'
      });
    } catch (error) {
      console.error('Manual reconnect failed:', error);
      toast.error('Échec de la reconnexion', {
        description: 'Veuillez rafraîchir la page pour réessayer.'
      });
    }
  };
  
  return { 
    realtimeStatus,
    lastConnectedAt,
    reconnectAttempts,
    manualReconnect
  };
}
