import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionFlowStore } from '@/features/session-flow/store';

const CreateSession = () => {
  const { user, loading } = useAuth();
  const { reset } = useSessionFlowStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Reset the flow state when entering the main create session page
    reset();
  }, [reset]);

  const handleStartFlow = () => {
    navigate('/create-session/cafe');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Coffee className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Create a Coworking Session
          </h1>
          <p className="text-lg text-muted-foreground">
            Set up a focused work session and invite others to join you
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              Ready to get started?
            </CardTitle>
            <CardDescription>
              We'll guide you through creating your session in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">What we'll set up:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📍 Choose your café or workspace</p>
                  <p>📅 Pick the perfect day and time</p>
                  <p>🔗 Get a shareable link to invite others</p>
                  <p>☕ Start your productive coworking session</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleStartFlow}
              size="lg"
              className="w-full h-14 text-lg gap-3"
            >
              <Plus className="w-5 h-5" />
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Button>

            <div className="text-center">
              <Button variant="ghost" asChild>
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateSession;