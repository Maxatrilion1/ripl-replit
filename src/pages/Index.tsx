import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Coffee, MapPin, Users, Clock, Plus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface CoworkSession {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_private: boolean;
  host_id: string;
  venue: {
    name: string;
    address: string;
    photo_url: string | null;
  };
  profiles: {
    name: string | null;
  };
  _count: {
    session_members: number;
  };
}

const Index = () => {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<CoworkSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [testingPlaces, setTestingPlaces] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔄 Auth: Redirecting to login - no authenticated user');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchPublicSessions = async () => {
      console.log('📊 Index: Fetching public sessions...');
      try {
        const { data, error } = await supabase
          .from('cowork_sessions')
          .select(`
            *,
            venues!inner(name, address, photo_url)
          `)
          .eq('is_private', false)
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(20);

        if (error) {
          console.error('❌ Index: Error fetching sessions:', error);
          toast({
            title: "Failed to load sessions",
            description: "Could not fetch upcoming sessions. Please refresh the page.",
            variant: "destructive"
          });
          setSessions([]);
          setLoadingSessions(false);
          return;
        }

        console.log('✅ Index: Fetched', data?.length || 0, 'sessions');

      // Get host profiles and member counts for each session
      const sessionsWithCounts = await Promise.all(
        (data || []).map(async (session) => {
          // Get host profile
          const { data: hostProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', session.host_id)
            .maybeSingle();

          // Get member count
          const { count } = await supabase
            .from('session_members')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            venue: session.venues,
            profiles: hostProfile || { name: null },
            _count: {
              session_members: count || 0
            }
          };
        })
      );

      setSessions(sessionsWithCounts);
      console.log('✅ Index: Sessions loaded with counts and profiles');
      setLoadingSessions(false);
    } catch (fetchError) {
      console.error('❌ Index: Unexpected error in fetchPublicSessions:', fetchError);
      toast({
        title: "Error loading sessions",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setSessions([]);
      setLoadingSessions(false);
    }
  };

  fetchPublicSessions();
  }, [user]);

  const testPlaces = async () => {
    console.log('🧪 Test: Starting Places API test...');
    setTestingPlaces(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query: 'coffee' }
      });
      if (error) {
        console.error('❌ Test: Places API error:', error);
        throw error;
      }
      console.log('✅ Test: Places API successful:', data?.places?.length || 0, 'results');
      toast({ 
        title: 'Places API OK', 
        description: `${data?.places?.length ?? 0} results returned` 
      });
    } catch (e: any) {
      console.error('❌ Test: Places API test failed:', e);
      toast({ 
        title: 'Places API error', 
        description: e?.message ?? 'Request failed', 
        variant: 'destructive' 
      });
    } finally {
      setTestingPlaces(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Find Your Focus Tribe
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Join productive cowork sessions at cafés near you. Connect with focused professionals 
            and boost your productivity together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/create-session/cafe">
                <Plus className="w-4 h-4 mr-2" />
                Host a Session
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/sessions">Browse All Sessions</Link>
            </Button>
            <Button variant="ghost" size="lg" onClick={testPlaces} disabled={testingPlaces}>
              {testingPlaces ? 'Testing...' : 'Test Places API'}
            </Button>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
          <Link to="/sessions">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>

        {loadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center p-8">
            <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No sessions yet</CardTitle>
            <CardDescription className="mb-4">
              Be the first to host a cowork session in your area!
            </CardDescription>
            <Button asChild>
              <Link to="/create-session/cafe">Host the First Session</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={`/sessions/${session.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {session.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">
                              {session.profiles?.name?.[0] || 'H'}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {session.profiles?.name || 'Host'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {session._count.session_members} attending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{session.venue.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(session.start_time), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {session._count.session_members} attending
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.description}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
