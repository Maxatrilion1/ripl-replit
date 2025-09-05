import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useAnonymousRestrictions = () => {
  const { user, session } = useAuth();
  
  // Check if user is anonymous
  const isAnonymous = user?.user_metadata?.is_anonymous === true;
  
  // Get current profile data to check virtual joins
  const getVirtualJoinsRemaining = async () => {
    if (!isAnonymous || !user) return null;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('profiles')
        .select('virtual_joins_this_month')
        .eq('user_id', user.id)
        .single();
      
      return Math.max(0, 5 - (data?.virtual_joins_this_month || 0));
    } catch (error) {
      console.error('Error fetching virtual joins:', error);
      return null;
    }
  };

  // Check if action is allowed for anonymous users
  const checkAnonymousAction = (action: string, showUpgradePrompt = true) => {
    if (!isAnonymous) return true;
    
    if (showUpgradePrompt) {
      toast({
        title: "Upgrade Required",
        description: `${action} requires a full account. Sign up or sign in to unlock all features.`,
        variant: "default"
      });
    }
    
    return false;
  };

  // Specific restriction checkers
  const canJoinSprints = () => checkAnonymousAction("Joining sprints");
  const canReact = () => checkAnonymousAction("Reactions");
  const canViewProfiles = () => checkAnonymousAction("Viewing detailed profiles");
  const canCreateSessions = () => checkAnonymousAction("Creating sessions");
  const canChat = () => checkAnonymousAction("Chat participation");

  // Show upgrade prompt
  const showUpgradePrompt = (feature: string) => {
    toast({
      title: "Unlock Full Features",
      description: `${feature} is available with a full account. Create your profile to get started!`,
      variant: "default"
    });
  };

  return {
    isAnonymous,
    canJoinSprints,
    canReact,
    canViewProfiles,
    canCreateSessions,
    canChat,
    checkAnonymousAction,
    showUpgradePrompt,
    getVirtualJoinsRemaining
  };
};