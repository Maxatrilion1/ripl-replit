import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MapPin, Users, Clock, ArrowLeft, Calendar, Download, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { SprintTimer } from '@/components/SprintTimer';
import { SessionPresence } from '@/components/SessionPresence';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { SessionSkeleton } from '@/components/SessionSkeleton';

interface SessionRecord {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_private: boolean;
  host_id: string;
  venues: {
    name: string;
    address: string;
    photo_url: string | null;
  };
}

const Session = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [hostName, setHostName] = useState<string>('Host');
  const [notFound, setNotFound] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [isAttending, setIsAttending] = useState(false);
  const [loadingRSVP, setLoadingRSVP] = useState(false);

  // Realtime session data with enhanced connection management
  const { 
    memberCount: liveMemberCount, 
    activeSprint, 
    onlineUsers, 
    onlineCount,
    connectionStatus,
    reconnectAttempts,
    isConnected,
    isLoading: realtimeLoading
  } = useRealtimeSession({
    sessionId: id || '',
    userId: user?.id || null,
    displayName: user?.email || 'Anonymous'
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setFetching(false);
      return;
    }

    const fetchSession = async () => {
      console.log('📖 Session: Fetching session details for ID:', id);
      try {
        const { data, error } = await supabase
          .from('cowork_sessions')
          .select(`*, venues(name, address, photo_url)`) 
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Session: Error fetching session:', error);
          setNotFound(true);
          setFetching(false);
          return;
        }

        if (!data) {
          console.warn('⚠️ Session: No session data returned');
          setNotFound(true);
          setFetching(false);
          return;
        }

        console.log('✅ Session: Session loaded:', data.title);
        setSession(data as unknown as SessionRecord);

        // Host display name
        console.log('👤 Session: Fetching host profile...');
        const { data: hostProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', (data as any).host_id)
          .single();
        if (hostProfile?.name) {
          console.log('✅ Session: Host name loaded:', hostProfile.name);
          setHostName(hostProfile.name);
        }

        // Member count
        console.log('👥 Session: Fetching member count...');
        const { count } = await supabase
          .from('session_members')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', id);
        console.log('✅ Session: Member count:', count || 0);
        setMemberCount(count || 0);

        // Check if current user is attending
        if (user?.id) {
          console.log('🎫 Session: Checking attendance for user:', user.id);
          const { data: membershipData } = await supabase
            .from('session_members')
            .select('id')
            .eq('session_id', id)
            .eq('user_id', user.id)
            .single();
          const attending = Boolean(membershipData);
          console.log('✅ Session: User attendance status:', attending);
          setIsAttending(attending);
        }

        // SEO title
        document.title = `${data.title} — Ripl Session`;
        console.log('✅ Session: Page setup complete');
      } catch (e) {
        console.error('❌ Session: Unexpected error fetching session:', e);
        setNotFound(true);
      } finally {
        setFetching(false);
      }
    };

    fetchSession();
  }, [id, user]);

  const handleAddToGoogleCalendar = async () => {
    if (!session) return;
    
    console.log('📅 Session: Adding to Google Calendar for session:', session.id);
    setLoadingCalendar(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: { sessionId: session.id }
      });

      if (error) {
        console.error('❌ Session: Calendar sync error:', error);
        throw error;
      }
      
      console.log('✅ Session: Google Calendar URL generated, opening...');
      window.open(data.googleCalendarUrl, '_blank');
    } catch (error) {
      console.error('❌ Session: Google Calendar failed:', error);
      toast({
        title: "Calendar sync failed",
        description: "Could not add to Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleDownloadICS = async () => {
    if (!session) return;
    
    console.log('📥 Session: Generating ICS download for session:', session.id);
    setLoadingCalendar(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: { sessionId: session.id }
      });

      if (error) {
        console.error('❌ Session: ICS generation error:', error);
        throw error;
      }
      
      console.log('✅ Session: ICS content generated, downloading...');
      const blob = new Blob([data.icsContent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('✅ Session: ICS file downloaded successfully');
    } catch (error) {
      console.error('❌ Session: ICS download failed:', error);
      toast({
        title: "Download failed",
        description: "Could not download calendar file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleRSVP = async () => {
    if (!session || !user) return;
    
    console.log('🎫 Session: RSVP action for session:', session.id, 'current status:', isAttending);
    setLoadingRSVP(true);
    try {
      if (isAttending) {
        // Leave the session
        console.log('➖ Session: Leaving session...');
        const { error } = await supabase
          .from('session_members')
          .delete()
          .eq('session_id', session.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Session: Error leaving session:', error);
          throw error;
        }
        
        setIsAttending(false);
        setMemberCount(prev => Math.max(0, prev - 1));
        console.log('✅ Session: Successfully left session');
        toast({
          title: "Left session",
          description: "You're no longer attending this session."
        });
      } else {
        // Join the session
        console.log('➕ Session: Joining session...');
        const { error } = await supabase
          .from('session_members')
          .insert({
            session_id: session.id,
            user_id: user.id
          });

        if (error) {
          console.error('❌ Session: Error joining session:', error);
          throw error;
        }
        
        setIsAttending(true);
        setMemberCount(prev => prev + 1);
        console.log('✅ Session: Successfully joined session');
        toast({
          title: "You're in!",
          description: "Successfully joined the session."
        });
      }
    } catch (error) {
      console.error('❌ Session: RSVP failed:', error);
      toast({
        title: "RSVP failed",
        description: "Could not update your attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingRSVP(false);
    }
  };

  if (loading || fetching) {
    return <SessionSkeleton />;
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Session not found</h1>
          <p className="text-muted-foreground">This event may have been deleted or is private.</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <ConnectionStatus 
              status={connectionStatus} 
              reconnectAttempts={reconnectAttempts}
            />
            <NotificationDropdown userId={user?.id || null} />
          </div>
        </div>
      </header>

      <main>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{session.title}</CardTitle>
                <CardDescription>{session.description}</CardDescription>
              </div>
              <Badge variant="secondary">
                {memberCount} attending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">{hostName?.[0] || 'H'}</AvatarFallback>
              </Avatar>
              <span>Hosted by {hostName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{session.venues?.name}</div>
                  <div className="line-clamp-1">{session.venues?.address}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="font-medium text-foreground">
                    {format(new Date(session.start_time), 'MMM d, h:mm a')}
                  </div>
                  <div>
                    Until {format(new Date(session.end_time), 'h:mm a')}
                  </div>
                </div>
              </div>
            </div>

            {/* Session presence and live updates */}
            <SessionPresence 
              memberCount={liveMemberCount || memberCount}
              onlineUsers={onlineUsers}
              onlineCount={onlineCount}
            />

            {/* Sprint Timer */}
            <SprintTimer 
              sessionId={id || ''}
              userId={user?.id || null}
              isHost={session?.host_id === user?.id}
              activeSprint={activeSprint}
              displayName={user?.email || 'Anonymous'}
            />

            <Separator />

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant={isAttending ? "secondary" : "default"}
                size="sm"
                onClick={handleRSVP}
                disabled={loadingRSVP}
                className="flex-shrink-0"
              >
                {loadingRSVP ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : isAttending ? (
                  <UserMinus className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {loadingRSVP ? 'Updating...' : isAttending ? 'Leave Session' : 'I\'m Attending'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToGoogleCalendar}
                disabled={loadingCalendar}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {loadingCalendar ? 'Adding...' : 'Add to Google Calendar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadICS}
                disabled={loadingCalendar}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .ics
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Session;