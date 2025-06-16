
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionState, setConnectionState] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTED');
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const manualReconnect = async () => {
    console.log('Manual reconnection attempt...');
    setConnectionState('CONNECTING');
    setReconnectAttempts(prev => prev + 1);
    
    // Force reconnection by creating a new channel
    const testChannel = supabase.channel('test-connection');
    testChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setConnectionState('CONNECTED');
        setLastConnectedAt(new Date());
        supabase.removeChannel(testChannel);
      }
    });
  };

  useEffect(() => {
    // Monitor connection status using Supabase's built-in events
    const channel = supabase.channel('connection-status');
    
    channel
      .on('system', {}, (payload) => {
        console.log('Realtime system event:', payload);
        
        if (payload.status === 'ok') {
          setIsConnected(true);
          setConnectionState('CONNECTED');
          setLastConnectedAt(new Date());
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
          setLastConnectedAt(new Date());
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionState('DISCONNECTED');
          setReconnectAttempts(prev => prev + 1);
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
    connectionState,
    realtimeStatus: connectionState.toLowerCase() as 'connected' | 'connecting' | 'disconnected',
    lastConnectedAt,
    reconnectAttempts,
    manualReconnect
  };
};
