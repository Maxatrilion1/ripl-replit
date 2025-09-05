import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeConnectionProps {
  channelName: string;
  onReconnect?: () => void;
}

export const useRealtimeConnection = ({ channelName, onReconnect }: UseRealtimeConnectionProps) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const createChannel = useCallback((name: string) => {
    return supabase.channel(name, {
      config: {
        presence: { key: 'user' },
        broadcast: { self: false },
      },
    });
  }, []);

  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus('error');
      toast({
        title: "Connection failed",
        description: "Unable to reconnect to real-time updates. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts, RECONNECT_DELAYS.length - 1)];
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
    
    setConnectionStatus('connecting');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      onReconnect?.();
    }, delay);
  }, [reconnectAttempts, onReconnect, toast]);

  const connect = useCallback((name: string) => {
    cleanup();
    
    const channel = createChannel(name);
    channelRef.current = channel;
    
    channel.subscribe((status, error) => {
      console.log(`Channel ${name} status:`, status, error);
      
      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus('connected');
          setReconnectAttempts(0); // Reset on successful connection
          if (reconnectAttempts > 0) {
            toast({
              title: "Reconnected",
              description: "Real-time updates restored",
            });
          }
          break;
          
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          console.error('Channel connection failed:', status, error);
          setConnectionStatus('disconnected');
          handleReconnect();
          break;
          
        default:
          setConnectionStatus('connecting');
      }
    });
    
    return channel;
  }, [cleanup, createChannel, handleReconnect, reconnectAttempts, toast]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    connectionStatus,
    reconnectAttempts,
    connect,
    cleanup,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error',
  };
};