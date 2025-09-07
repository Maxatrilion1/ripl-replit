import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Coffee, MapPin, Users, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';

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
  const [loadingSessions, setLoadingSessions] = useState(false);
  const navigate = useNavigate();

  console.log('🏠 Index: Component rendering, user:', !!user, 'loading:', loading);

  useEffect(() => {
    if (!loading && user) {
      fetchPublicSessions();
    }
  }, [user, loading]);

  const fetchPublicSessions = async () => {
    console.log('📊 Index: Fetching public sessions...');
    setLoadingSessions(true);
    
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
        setSessions([]);
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
    } catch (fetchError) {
      console.error('❌ Index: Unexpected error in fetchPublicSessions:', fetchError);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Coffee className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Ripl
              </h1>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Find Your Focus Tribe</h2>
            <p className="text-sm text-muted-foreground">
              Join productive cowork sessions at cafés near you
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <Button asChild className="w-full">
                <Link to="/auth">
                  Get Started
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Sign in to create sessions and join the community
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Layout>
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
    </Layout>
  );
};

export default Index;