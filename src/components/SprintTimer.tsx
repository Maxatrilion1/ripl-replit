import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Play, Square, Clock, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SprintParticipants } from './SprintParticipants';
import { SprintReactions } from './SprintReactions';

interface Sprint {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  status: string;
  started_by: string;
  session_id: string;
  paused_at: string | null;
  total_paused_ms: number;
}

interface SprintTimerProps {
  sessionId: string;
  userId: string | null;
  isHost: boolean;
  activeSprint: Sprint | null;
  displayName: string;
}

export const SprintTimer = ({ sessionId, userId, isHost, activeSprint, displayName }: SprintTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  // Calculate time remaining with pause logic
  useEffect(() => {
    if (!activeSprint || activeSprint.status !== 'active') {
      setTimeRemaining(0);
      setIsActive(false);
      setIsPaused(false);
      return;
    }

    const isPausedNow = !!activeSprint.paused_at;
    setIsPaused(isPausedNow);

    const calculateTimeRemaining = () => {
      const startTime = new Date(activeSprint.start_time).getTime();
      const durationMs = activeSprint.duration_minutes * 60 * 1000;
      const totalPausedMs = activeSprint.total_paused_ms || 0;
      
      let elapsedTime = 0;
      const now = Date.now();
      
      if (isPausedNow && activeSprint.paused_at) {
        // Sprint is currently paused - use paused_at timestamp
        const pausedAt = new Date(activeSprint.paused_at).getTime();
        elapsedTime = pausedAt - startTime - totalPausedMs;
      } else {
        // Sprint is running - use current time
        elapsedTime = now - startTime - totalPausedMs;
      }
      
      const remaining = Math.max(0, durationMs - elapsedTime);
      setTimeRemaining(Math.floor(remaining / 1000));
      setIsActive(remaining > 0 && !isPausedNow);
      
      // Auto-complete sprint when timer reaches 0 (only if not paused)
      if (remaining === 0 && !isPausedNow && activeSprint.status === 'active') {
        handleSprintEnd();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeSprint]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSprint = async () => {
    if (!userId || !isHost) return;

    console.log('Starting new sprint for session:', sessionId);

    try {
      const startTime = new Date().toISOString();
      const { data, error } = await supabase
        .from('sprints')
        .insert({
          session_id: sessionId,
          started_by: userId,
          title: 'Focus Sprint',
          duration_minutes: 25,
          start_time: startTime,
          status: 'active',
          end_time: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting sprint:', error);
        toast({
          title: "Error starting sprint",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sprint started successfully:', data);
        toast({
          title: "Sprint started",
          description: "25-minute focus sprint is now active",
        });

        // Notify session members about sprint start
        await notifySessionMembers(sessionId, 'sprint_started', 'Sprint Started!', 'A new focus sprint has begun. Join now to participate!');
      }
    } catch (error) {
      console.error('Failed to start sprint:', error);
      toast({
        title: "Failed to start sprint", 
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Helper function to notify session members
  const notifySessionMembers = async (sessionId: string, type: string, title: string, message: string) => {
    try {
      // Get all session members
      const { data: members, error } = await supabase
        .from('session_members')
        .select('user_id')
        .eq('session_id', sessionId);

      if (error || !members) {
        console.error('Error fetching session members for notifications:', error);
        return;
      }

      // Create notifications for all members
      const notifications = members
        .filter(member => member.user_id !== userId) // Don't notify the user who triggered the action
        .map(member => ({
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
          console.error('Error creating notifications:', notificationError);
        } else {
          console.log(`Created ${notifications.length} notifications for ${type}`);
        }
      }
    } catch (error) {
      console.error('Failed to notify session members:', error);
    }
  };

  const handlePauseSprint = async () => {
    if (!activeSprint || !userId || !isHost) return;

    console.log('Pausing sprint:', activeSprint.id);

    try {
      const { error } = await supabase
        .from('sprints')
        .update({
          paused_at: new Date().toISOString()
        })
        .eq('id', activeSprint.id);

      if (error) {
        console.error('Error pausing sprint:', error);
        toast({
          title: "Error pausing sprint",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sprint paused successfully');
        toast({
          title: "Sprint paused",
          description: "Timer has been paused",
        });
      }
    } catch (error) {
      console.error('Failed to pause sprint:', error);
    }
  };

  const handleResumeSprint = async () => {
    if (!activeSprint || !userId || !isHost || !activeSprint.paused_at) return;

    console.log('Resuming sprint:', activeSprint.id);

    try {
      // Calculate additional paused time
      const pausedAt = new Date(activeSprint.paused_at).getTime();
      const now = Date.now();
      const additionalPausedMs = now - pausedAt;
      const newTotalPausedMs = (activeSprint.total_paused_ms || 0) + additionalPausedMs;

      const { error } = await supabase
        .from('sprints')
        .update({
          paused_at: null,
          total_paused_ms: newTotalPausedMs
        })
        .eq('id', activeSprint.id);

      if (error) {
        console.error('Error resuming sprint:', error);
        toast({
          title: "Error resuming sprint",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sprint resumed successfully');
        toast({
          title: "Sprint resumed",
          description: "Timer is now running",
        });
      }
    } catch (error) {
      console.error('Failed to resume sprint:', error);
    }
  };

  const handleSprintEnd = async () => {
    if (!activeSprint || !userId) return;

    console.log('Ending sprint:', activeSprint.id);

    try {
      const updateData: any = {
        status: 'completed',
        end_time: new Date().toISOString()
      };

      // If sprint was paused, add final paused time
      if (activeSprint.paused_at) {
        const pausedAt = new Date(activeSprint.paused_at).getTime();
        const now = Date.now();
        const additionalPausedMs = now - pausedAt;
        updateData.total_paused_ms = (activeSprint.total_paused_ms || 0) + additionalPausedMs;
        updateData.paused_at = null;
      }

      const { error } = await supabase
        .from('sprints')
        .update(updateData)
        .eq('id', activeSprint.id);

      if (error) {
        console.error('Error ending sprint:', error);
        toast({
          title: "Error ending sprint",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sprint ended successfully');
        toast({
          title: "Sprint completed",
          description: "Great work! Take a well-deserved break.",
        });

        // Notify session members about sprint completion
        await notifySessionMembers(sessionId, 'sprint_completed', 'Sprint Completed!', 'The focus sprint has ended. Great work everyone!');
      }
    } catch (error) {
      console.error('Failed to end sprint:', error);
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Sprint Timer</h3>
        </div>

        {activeSprint && (isActive || isPaused) ? (
          <>
            <div className="text-4xl font-mono font-bold text-primary">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">
              {activeSprint.title} • {activeSprint.duration_minutes} minutes
              {isPaused && " • PAUSED"}
            </p>
            
            {/* Sprint Participants */}
            <Separator />
            <SprintParticipants 
              sprintId={activeSprint.id}
              sessionId={sessionId}
              userId={userId}
              isSprintActive={isActive && !isPaused}
            />
            
            {/* Sprint Reactions */}
            <Separator />
            <SprintReactions
              sprintId={activeSprint.id}
              userId={userId}
              displayName={displayName}
              isSprintActive={isActive && !isPaused}
            />
            
            {isHost && (
              <>
                <Separator />
                <div className="flex gap-2">
                  {isPaused ? (
                    <Button 
                      onClick={handleResumeSprint}
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                  ) : (
                    <Button 
                      onClick={handlePauseSprint}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                  )}
                  <Button 
                    onClick={handleSprintEnd}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    End Sprint
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="text-4xl font-mono font-bold text-muted-foreground">
              25:00
            </div>
            <p className="text-sm text-muted-foreground">
              Ready to start a focused work session
            </p>
            {isHost ? (
              <Button 
                onClick={handleStartSprint}
                disabled={!userId}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Start Sprint
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Waiting for host to start sprint
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
};