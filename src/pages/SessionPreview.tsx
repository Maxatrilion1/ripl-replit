import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Clock, Users, Coffee, Calendar, ArrowRight } from 'lucide-react';
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

const SessionPreview = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Invalid session link');
      setLoading(false);
      return;
    }

    const fetchSessionPreview = async () => {
      try {
        const { data, error } = await supabase.rpc('get_session_preview', {
          invite_code: slug
        });

        if (error) {
          console.error('Error fetching session preview:', error);
          setError('Failed to load session details');
          return;
        }

        if (!data || data.length === 0) {
          setError('Session not found');
          return;
        }

        setSession(data[0]);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionPreview();
  }, [slug]);

  const handleJoinSession = () => {
    if (!user) {
      // Redirect to auth with return path
      navigate(`/auth?redirect=/sessions/${session?.session_id}`);
    } else if (session) {
      // User is authenticated, go to session
      navigate(`/sessions/${session.session_id}`);
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/invite/${slug}`;
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Session Not Found</CardTitle>
            <CardDescription>This session may have been deleted or the link is invalid</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Session Card */}
        <Card className="mb-8 shadow-xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Coffee className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold">
              {session.title}
            </CardTitle>
            
            <div className="flex items-center justify-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.host_avatar_url || ''} />
                <AvatarFallback className="bg-primary/10">
                  {session.host_display_name?.[0] || 'H'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                Hosted by {session.host_display_name || 'Host'}
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Session Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="text-sm text-muted-foreground">{session.venue_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.start_time), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendee Preview */}
            {session.attendee_avatars.length > 0 && (
              <div className="text-center space-y-3">
                <p className="font-medium text-foreground">Others joining</p>
                <div className="flex justify-center -space-x-2">
                  {session.attendee_avatars.slice(0, 6).map((avatarUrl, index) => (
                    <Avatar key={index} className="w-12 h-12 border-2 border-background">
                      <AvatarImage src={avatarUrl || ''} />
                      <AvatarFallback className="bg-accent/20">
                        {index + 1}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {session.attendee_avatars.length > 6 && (
                  <p className="text-sm text-muted-foreground">
                    +{session.attendee_avatars.length - 6} more joining
                  </p>
                )}
              </div>
            )}

            {/* Call to Action */}
            <div className="space-y-4 pt-4 border-t">
              <Button 
                onClick={handleJoinSession}
                size="lg"
                className="w-full h-14 text-lg gap-3"
              >
                {user ? 'Join Session' : 'Sign In to Join'}
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                onClick={copyInviteLink}
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Invite Link
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  You'll need to sign in or create an account to join this session
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Powered by Ripl - Focus together, achieve more
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Create your own session
          </Button>
        </div>
      </div>
    </div>
  );
};