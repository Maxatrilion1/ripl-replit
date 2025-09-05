import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  name: string;
  created_at: string;
}

interface SprintReactionsProps {
  sprintId: string | null;
  userId: string | null;
  displayName: string;
  isSprintActive: boolean;
}

const REACTION_EMOJIS = ['👍', '🔥', '💪', '✨', '🚀', '⚡', '🎯', '💯'];

export const SprintReactions = ({ sprintId, userId, displayName, isSprintActive }: SprintReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [recentReactions, setRecentReactions] = useState<Reaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!sprintId) {
      setReactions([]);
      setRecentReactions([]);
      return;
    }

    // Set up realtime channel for reactions
    const channel = supabase.channel(`sprint_reactions_${sprintId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    // Listen for reaction broadcasts
    channel.on('broadcast', { event: 'reaction' }, (payload) => {
      console.log('Received reaction:', payload);
      const reaction = payload.payload as Reaction;
      
      // Add to recent reactions (temporary display)
      setRecentReactions(prev => [...prev, reaction]);
      
      // Remove from recent reactions after animation
      setTimeout(() => {
        setRecentReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3000);
      
      // Update reaction count
      setReactions(prev => [...prev, reaction]);
      
      // Show toast for reactions from other users
      if (reaction.user_id !== userId) {
        toast({
          title: `${reaction.emoji} ${reaction.name}`,
          description: "Sent a reaction",
          duration: 2000,
        });
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sprintId, userId, toast]);

  const sendReaction = async (emoji: string) => {
    if (!sprintId || !userId || !isSprintActive) return;

    const reaction: Reaction = {
      id: crypto.randomUUID(),
      emoji,
      user_id: userId,
      name: displayName,
      created_at: new Date().toISOString(),
    };

    console.log('Sending reaction:', reaction);

    // Broadcast reaction to all users in the sprint
    const channel = supabase.channel(`sprint_reactions_${sprintId}`);
    await channel.send({
      type: 'broadcast',
      event: 'reaction',
      payload: reaction,
    });

    // Add to local state immediately for sender
    setRecentReactions(prev => [...prev, reaction]);
    setReactions(prev => [...prev, reaction]);

    // Remove from recent reactions after animation
    setTimeout(() => {
      setRecentReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

  if (!sprintId || !isSprintActive) {
    return null;
  }

  const reactionCounts = getReactionCounts();

  return (
    <div className="space-y-3">
      {/* Recent reactions animation */}
      <div className="relative h-8">
        {recentReactions.map((reaction, index) => (
          <div
            key={reaction.id}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 80}%`,
              animationDelay: `${index * 200}ms`,
              animationDuration: '3s',
            }}
          >
            <span className="text-2xl animate-bounce">
              {reaction.emoji}
            </span>
          </div>
        ))}
      </div>

      {/* Reaction buttons */}
      <Card className="p-3 bg-card/30 backdrop-blur-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground text-center">
            Quick Reactions
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            {REACTION_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => sendReaction(emoji)}
                disabled={!userId || !isSprintActive}
                className="h-8 w-8 p-0 hover:bg-primary/10 relative"
              >
                <span className="text-lg">{emoji}</span>
                {reactionCounts[emoji] && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {reactionCounts[emoji]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};