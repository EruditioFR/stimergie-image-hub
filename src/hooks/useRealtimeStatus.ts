
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionState, setConnectionState] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTED');

  useEffect(() => {
    // Monitor connection status using Supabase's built-in events
    const channel = supabase.channel('connection-status');
    
    channel
      .on('system', {}, (payload) => {
        console.log('Realtime system event:', payload);
        
        if (payload.status === 'ok') {
          setIsConnected(true);
          setConnectionState('CONNECTED');
        } else {
          setIsConnected(false);
          setConnectionState('DISCONNECTED');
        }
      })
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionState('CONNECTED');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionState('DISCONNECTED');
        } else {
          setConnectionState('CONNECTING');
        }
      });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isConnected,
    connectionState
  };
};
