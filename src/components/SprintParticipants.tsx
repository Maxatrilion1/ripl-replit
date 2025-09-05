import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SprintParticipantsSkeleton } from './SprintParticipantsSkeleton';

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  is_virtual: boolean;
  profiles?: {
    name: string;
  };
}

interface SprintParticipantsProps {
  sprintId: string | null;
  sessionId: string;
  userId: string | null;
  isSprintActive: boolean;
}

export const SprintParticipants = ({ sprintId, sessionId, userId, isSprintActive }: SprintParticipantsProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();

  // Fetch participants when sprint changes
  useEffect(() => {
    if (!sprintId) {
      setParticipants([]);
      setIsParticipating(false);
      setInitialLoading(false);
      return;
    }

    fetchParticipants();
    
    // Set up realtime subscription for participant changes
    const channel = supabase
      .channel(`sprint_participants_${sprintId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_participations',
          filter: `sprint_id=eq.${sprintId}`,
        },
        (payload) => {
          console.log('Sprint participants changed:', payload);
          fetchParticipants(); // Refetch to get updated data with profiles
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sprintId, userId]);

  const fetchParticipants = async () => {
    if (!sprintId) return;

    console.log('Fetching sprint participants for sprint:', sprintId);
    
    try {
      // First fetch participants
      const { data: participantData, error: participantError } = await supabase
        .from('sprint_participations')
        .select('id, user_id, joined_at, is_virtual')
        .eq('sprint_id', sprintId);

      if (participantError) {
        console.error('Error fetching participants:', participantError);
        return;
      }

      if (!participantData || participantData.length === 0) {
        console.log('No sprint participants found');
        setParticipants([]);
        setIsParticipating(false);
        return;
      }

      // Fetch profiles for all participants
      const userIds = participantData.map(p => p.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        // Still set participants without profile data
        setParticipants(participantData.map(p => ({ ...p, profiles: { name: 'User' } })));
      } else {
        // Combine participants with profile data
        const participantsWithProfiles = participantData.map(participant => {
          const profile = profileData?.find(p => p.user_id === participant.user_id);
          return {
            ...participant,
            profiles: {
              name: profile?.name || 'User'
            }
          };
        });
        
        console.log('Sprint participants loaded:', participantsWithProfiles.length);
        setParticipants(participantsWithProfiles);
      }
      
      // Check if current user is participating
      const userParticipating = participantData.some(p => p.user_id === userId) || false;
      setIsParticipating(userParticipating);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleJoinSprint = async () => {
    if (!sprintId || !userId || !isSprintActive || isParticipating) return;

    console.log('Joining sprint:', sprintId);
    setLoading(true);

    try {
      const { error } = await supabase
        .from('sprint_participations')
        .insert({
          sprint_id: sprintId,
          user_id: userId,
          is_virtual: false
        });

      if (error) {
        console.error('Error joining sprint:', error);
        toast({
          title: "Error joining sprint",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Successfully joined sprint');
        toast({
          title: "Joined sprint",
          description: "You're now part of this focus session!",
        });
      }
    } catch (error) {
      console.error('Failed to join sprint:', error);
      toast({
        title: "Failed to join sprint",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSprint = async () => {
    if (!sprintId || !userId || !isParticipating) return;

    console.log('Leaving sprint:', sprintId);
    setLoading(true);

    try {
      const { error } = await supabase
        .from('sprint_participations')
        .delete()
        .eq('sprint_id', sprintId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error leaving sprint:', error);
        toast({
          title: "Error leaving sprint",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Successfully left sprint');
        toast({
          title: "Left sprint",
          description: "You've stopped participating in this sprint",
        });
      }
    } catch (error) {
      console.error('Failed to leave sprint:', error);
      toast({
        title: "Failed to leave sprint",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {initialLoading ? (
        <SprintParticipantsSkeleton />
      ) : (
        <>
          {/* Participant count and join/leave button */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-2">
              <Users className="w-3 h-3" />
              {participants.length} participating
            </Badge>

            {userId && isSprintActive && (
              <Button
                onClick={isParticipating ? handleLeaveSprint : handleJoinSprint}
                disabled={loading}
                variant={isParticipating ? "outline" : "default"}
                size="sm"
                className="gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                ) : isParticipating ? (
                  <UserMinus className="w-3 h-3" />
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
                {loading ? 'Updating...' : isParticipating ? 'Leave Sprint' : 'Join Sprint'}
              </Button>
            )}

            {!isSprintActive && sprintId && (
              <span className="text-xs text-muted-foreground">Sprint not active</span>
            )}
          </div>

          {/* Participant avatars */}
          {participants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Currently participating:</p>
              <div className="flex flex-wrap gap-2">
                {participants.slice(0, 6).map((participant) => (
                  <div key={participant.id} className="flex items-center gap-1">
                    <Avatar className="w-5 h-5 border border-border">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(participant.profiles?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {participant.profiles?.name || 'User'}
                    </span>
                  </div>
                ))}
                {participants.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{participants.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};