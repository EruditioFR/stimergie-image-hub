
import { useState, useEffect } from 'react';
import { supabase, refreshSession } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeStatus() {
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  useEffect(() => {
    // Set up a channel subscription for downloads page presence and monitoring
    const downloadChannel = supabase.channel('download_page_presence', {
      config: {
        presence: {
          key: 'download_page',
        },
      }
    });
    
    // Set up the channel subscription with better logging
    const subscription = downloadChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('Realtime presence synchronized for downloads page');
        setRealtimeStatus('connected');
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('User joined downloads page:', key);
      })
      .on('system', { event: 'disconnect' }, () => {
        console.log('Realtime disconnected');
        setRealtimeStatus('disconnected');
        
        // Try to refresh the session when disconnected
        refreshSession().catch(err => {
          console.error('Failed to refresh session during disconnect:', err);
        });
      })
      .on('system', { event: 'reconnect' }, () => {
        console.log('Realtime reconnecting...');
        setRealtimeStatus('connecting');
      })
      .on('system', { event: 'connected' }, () => {
        console.log('Realtime connected');
        setRealtimeStatus('connected');
      })
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        
        // If subscription fails, try to refresh the session
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('Attempting to refresh session due to subscription error');
          await refreshSession();
        }
      });
    
    console.log('Realtime configured for downloads page');
    
    return () => {
      // Cleanup when component unmounts
      console.log('Removing download page channel');
      supabase.removeChannel(downloadChannel);
    };
  }, []);
  
  return { realtimeStatus };
}
