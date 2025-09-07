import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Coffee, MapPin, Users, Clock, Plus, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

const Sessions = () => {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<CoworkSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchAllSessions = async () => {
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
          .limit(50);

        if (error) {
          console.error('Error fetching sessions:', error);
          setSessions([]);
          setLoadingSessions(false);
          return;
        }

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
        setLoadingSessions(false);
      } catch (fetchError) {
        console.error('Error in fetchAllSessions:', fetchError);
        setSessions([]);
        setLoadingSessions(false);
      }
    };

    fetchAllSessions();
  }, [user]);

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
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Sessions</h1>
            <p className="text-muted-foreground">
              Browse and join cowork sessions happening near you
            </p>
          </div>
          <Button asChild>
            <Link to="/create-session/cafe">
              <Plus className="w-4 h-4 mr-2" />
              Host a Session
            </Link>
          </Button>
        </div>
      </header>

      <main>
        {loadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center p-12">
            <Coffee className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <CardTitle className="text-2xl mb-4">No sessions available</CardTitle>
            <CardDescription className="text-lg mb-6">
              There are no public cowork sessions scheduled right now.
              <br />
              Be the first to host one in your area!
            </CardDescription>
            <Button asChild size="lg">
              <Link to="/create-session/cafe">
                <Plus className="w-5 h-5 mr-2" />
                Host the First Session
              </Link>
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
                        <CardTitle className="text-xl line-clamp-2 mb-3">
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
                      <Badge variant="secondary" className="ml-3">
                        {session._count.session_members} attending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{session.venue.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {format(new Date(session.start_time), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {session._count.session_members} attending
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                        {session.description}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Sessions;