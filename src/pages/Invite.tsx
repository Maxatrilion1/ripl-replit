import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAnonymousRestrictions } from '@/hooks/useAnonymousRestrictions';
import { useAnalytics, ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorRetry from '@/components/ErrorRetry';
import { MapPin, Clock, Copy, Linkedin, Mail, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface SessionPreview {
  session_id: string;
  title: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  host_display_name: string | null;
  host_avatar_url: string | null;
  attendee_avatars: string[];
}

const Invite = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading, signInWithLinkedIn, signInAsGuest } = useAuth();
  const { getVirtualJoinsRemaining } = useAnonymousRestrictions();
  const { track } = useAnalytics();
  const navigate = useNavigate();
  const [sessionPreview, setSessionPreview] = useState<SessionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningMethod, setJoiningMethod] = useState<string | null>(null);
  const [virtualJoinsLeft, setVirtualJoinsLeft] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!code) {
      setError('Invalid invite code');
      setLoading(false);
      return;
    }

    const fetchSessionPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.rpc('get_session_preview', {
          invite_code: code
        });

        if (error) {
          console.error('Error fetching session preview:', error);
          setError('Failed to load session details');
          return;
        }

        if (!data || data.length === 0) {
          setError('Session not found or invite code is invalid');
          return;
        }

        setSessionPreview(data[0]);
        
        // Track analytics
        track(ANALYTICS_EVENTS.INVITE_PREVIEW_VIEWED, {
          invite_code: code,
          session_id: data[0].session_id
        });
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    const loadVirtualJoins = async () => {
      const remaining = await getVirtualJoinsRemaining();
      setVirtualJoinsLeft(remaining);
    };

    fetchSessionPreview();
    loadVirtualJoins();
  }, [code, getVirtualJoinsRemaining, track, retryCount]);

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied!",
        description: "Invite link has been copied to your clipboard."
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually from the address bar.",
        variant: "destructive"
      });
    }
  };

  const handleLinkedInJoin = async () => {
    setJoiningMethod('linkedin');
    
    track(ANALYTICS_EVENTS.JOIN_PATH_CHOSEN, {
      join_method: 'linkedin',
      invite_code: code,
      session_id: sessionPreview?.session_id
    });
    
    try {
      await signInWithLinkedIn();
      // After successful auth, user will be redirected appropriately
    } catch (err) {
      setJoiningMethod(null);
      toast({
        title: "LinkedIn sign-in failed",
        description: "Please try another method.",
        variant: "destructive"
      });
    }
  };

  const handleEmailJoin = () => {
    setJoiningMethod('email');
    
    track(ANALYTICS_EVENTS.JOIN_PATH_CHOSEN, {
      join_method: 'email',
      invite_code: code,
      session_id: sessionPreview?.session_id
    });
    
    // Navigate to auth page with email method pre-selected and return path
    navigate(`/auth?method=email&redirect=/invite/${code}`);
  };

  const handleGuestJoin = () => {
    setJoiningMethod('guest');
    
    track(ANALYTICS_EVENTS.JOIN_PATH_CHOSEN, {
      join_method: 'guest',
      invite_code: code,
      session_id: sessionPreview?.session_id
    });
    
    // Sign in as anonymous guest directly
    signInAsGuest().then(() => {
      // After guest sign in, continue to session
      if (sessionPreview?.session_id) {
        navigate(`/sessions/${sessionPreview.session_id}`);
      }
    });
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleContinueToLobby = () => {
    // If user is already authenticated, continue to the session
    navigate(`/sessions/${sessionPreview?.session_id}`);
  };

  if (loading || authLoading) {
    return <LoadingSkeleton variant="invite" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-cowork-primary-light/10 to-cowork-accent-light/10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Unable to Load Session</CardTitle>
            <CardDescription>We couldn't load the session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorRetry 
              error={error}
              onRetry={handleRetry}
              type={error.includes('Network') ? 'network' : 'general'}
              retryLabel="Retry Loading"
            />
            <div className="text-center pt-2">
              <Button variant="outline" asChild>
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-cowork-primary-light/10 to-cowork-accent-light/10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Session Not Available</CardTitle>
            <CardDescription>This session could not be loaded.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cowork-primary-light/10 to-cowork-accent-light/10">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Event Card */}
        <Card className="mb-8 shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Avatar className="w-12 h-12 border-2 border-primary/20">
                <AvatarImage src={sessionPreview.host_avatar_url || ''} />
                <AvatarFallback className="bg-primary/10">
                  {sessionPreview.host_display_name?.[0] || 'H'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <p className="font-medium">{sessionPreview.host_display_name || 'Host'}</p>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-center">
              {sessionPreview.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Session Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="w-5 h-5 text-cowork-primary" />
                <span className="font-medium">{sessionPreview.venue_name}</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-cowork-primary" />
                <div>
                  <p className="font-medium">
                    {format(new Date(sessionPreview.start_time), 'EEEE, MMM d')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sessionPreview.start_time), 'h:mm a')} - {' '}
                    {format(new Date(sessionPreview.end_time), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendee Teasers */}
            {sessionPreview.attendee_avatars.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Others joining</p>
                <div className="flex justify-center -space-x-2 mb-2">
                  {sessionPreview.attendee_avatars.slice(0, 6).map((avatarUrl, index) => (
                    <Avatar key={index} className="w-10 h-10 border-2 border-background">
                      <AvatarImage src={avatarUrl || ''} />
                      <AvatarFallback className="bg-cowork-accent/20">
                        {index + 1}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {sessionPreview.attendee_avatars.length > 6 && (
                  <p className="text-xs text-muted-foreground">
                    +{sessionPreview.attendee_avatars.length - 6} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Options */}
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle>
              {user ? 'Ready to Join?' : 'Join this Session'}
            </CardTitle>
            <CardDescription>
              {user 
                ? 'Continue to the session lobby' 
                : 'Choose how you\'d like to join'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {user ? (
              // Authenticated user - show continue button
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleContinueToLobby}
              >
                Continue to Session Lobby
              </Button>
            ) : (
              // Non-authenticated user - show join options
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
                  onClick={handleLinkedInJoin}
                  disabled={joiningMethod === 'linkedin'}
                >
                  <Linkedin className="w-5 h-5 mr-2" />
                  {joiningMethod === 'linkedin' ? 'Connecting...' : 'Join with LinkedIn'}
                  <Badge variant="secondary" className="ml-2">Recommended</Badge>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleEmailJoin}
                  disabled={!!joiningMethod}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Continue with Email
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={handleGuestJoin}
                  disabled={!!joiningMethod}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Join as Anonymous Guest
                  <Badge variant="outline" className="ml-2">View Only</Badge>
                </Button>
                
                {virtualJoinsLeft !== null && virtualJoinsLeft < 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {virtualJoinsLeft > 0 
                      ? `${virtualJoinsLeft} anonymous joins remaining this month`
                      : 'No anonymous joins remaining this month'
                    }
                  </p>
                )}
              </div>
            )}
            
            {/* Copy Invite Link */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={copyInviteLink}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Invite;