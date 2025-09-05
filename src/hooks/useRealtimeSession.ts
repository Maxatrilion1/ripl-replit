import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeConnection } from './useRealtimeConnection';

interface SessionPresence {
  user_id: string;
  name: string;
  online_at: string;
}

interface UseRealtimeSessionProps {
  sessionId: string;
  userId: string | null;
  displayName: string;
}

export const useRealtimeSession = ({ sessionId, userId, displayName }: UseRealtimeSessionProps) => {
  const [memberCount, setMemberCount] = useState(0);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, SessionPresence>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Enhanced connection management with reconnect logic
  const { connectionStatus, reconnectAttempts, connect, isConnected } = useRealtimeConnection({
    channelName: `session_${sessionId}`,
    onReconnect: () => {
      console.log('Reconnecting realtime session...');
      setupRealtimeSubscriptions();
    },
  });

  const setupRealtimeSubscriptions = () => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    console.log('Setting up realtime subscriptions for session:', sessionId);

    // Create enhanced channel with reconnection support
    const channel = connect(`session_${sessionId}`);

    // Track user presence
    if (userId) {
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState<SessionPresence>();
        console.log('Presence sync:', newState);
        // Convert presence state to flat record
        const flatState: Record<string, SessionPresence> = {};
        Object.entries(newState).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            flatState[key] = presences[0];
          }
        });
        setOnlineUsers(flatState);
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const user = newPresences[0];
        if (user && user.user_id !== userId) {
          toast({
            title: "User joined",
            description: `${user.name} joined the session`,
          });
        }
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const user = leftPresences[0];
        if (user && user.user_id !== userId) {
          toast({
            title: "User left", 
            description: `${user.name} left the session`,
          });
        }
      });
    }

    // Subscribe to session member changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_members',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        console.log('Session members changed:', payload);
        
        if (payload.eventType === 'INSERT') {
          setMemberCount(prev => prev + 1);
          
          // Create notification for existing members about new user joining
          if (payload.new && payload.new.user_id !== userId) {
            // Get display name of joining user
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', payload.new.user_id)
              .single();
            
            const joiningUserName = profile?.name || 'Someone';
            
            // Notify existing session members
            await createSessionNotifications(
              sessionId, 
              payload.new.user_id, 
              'user_joined', 
              'New Member', 
              `${joiningUserName} joined the session`
            );
          }
        } else if (payload.eventType === 'DELETE') {
          setMemberCount(prev => Math.max(0, prev - 1));
        }
      }
    );

    // Subscribe to sprint changes
    channel.on(
      'postgres_changes', 
      {
        event: '*',
        schema: 'public',
        table: 'sprints',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Sprint changed:', payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setActiveSprint(payload.new);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Sprint started",
              description: `${payload.new.title} has begun!`,
            });
          } else if (payload.new.status === 'completed') {
            toast({
              title: "Sprint completed", 
              description: `${payload.new.title} has finished`,
            });
          }
        }
      }
    );

    // Subscribe and track presence with error handling
    channel.subscribe(async (status) => {
      console.log('Channel status:', status);
      
      if (status === 'SUBSCRIBED') {
        setIsLoading(false);
        
        if (userId) {
          try {
            await channel.track({
              user_id: userId,
              name: displayName,
              online_at: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Error tracking presence:', error);
          }
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('Channel subscription failed:', status);
        setIsLoading(false);
      }
    });

    return channel;
  };

  useEffect(() => {
    const channel = setupRealtimeSubscriptions();
    
    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscriptions');
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, userId, displayName]);

  // Helper function to create notifications for session members
  const createSessionNotifications = async (sessionId: string, excludeUserId: string, type: string, title: string, message: string) => {
    try {
      // Get all session members except the excluded user
      const { data: members, error } = await supabase
        .from('session_members')
        .select('user_id')
        .eq('session_id', sessionId)
        .neq('user_id', excludeUserId);

      if (error || !members) {
        console.error('Error fetching session members for notifications:', error);
        return;
      }

      // Create notifications for all members
      const notifications = members.map(member => ({
        user_id: member.user_id,
        type,
        title,
        message,
        session_id: sessionId,
      }));

      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating session notifications:', notificationError);
        } else {
          console.log(`Created ${notifications.length} notifications for ${type}`);
        }
      }
    } catch (error) {
      console.error('Failed to create session notifications:', error);
    }
  };

  const getOnlineUserCount = () => {
    return Object.keys(onlineUsers).length;
  };

  const getOnlineUsersList = () => {
    return Object.values(onlineUsers).flat();
  };

  return {
    memberCount,
    activeSprint,
    onlineUsers: getOnlineUsersList(),
    onlineCount: getOnlineUserCount(),
    connectionStatus,
    reconnectAttempts,
    isConnected,
    isLoading,
  };
};