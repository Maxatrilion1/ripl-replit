import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import ManualOnboarding from '@/components/ManualOnboarding';
import LinkedInConfirmation from '@/components/LinkedInConfirmation';
import { Linkedin, Coffee, LogIn } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const { user, session, signIn, signInWithLinkedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check what flow to show
  const showOnboarding = searchParams.get('method') === 'email' || window.location.pathname === '/auth/onboarding';
  const showLinkedInConfirm = window.location.pathname === '/auth/linkedin-confirm';
  
  // Check if we're coming from a shared session link
  const inviteCode = searchParams.get('invite') || searchParams.get('code');
  const redirectPath = inviteCode ? `/invite/${inviteCode}` : '/';
  
  // Extract LinkedIn data from URL params or user metadata
  const getLinkedInData = () => {
    if (user?.user_metadata) {
      return {
        name: user.user_metadata.full_name || user.user_metadata.name,
        headline: user.user_metadata.headline,
        picture: user.user_metadata.avatar_url || user.user_metadata.picture,
        email: user.email,
        profileUrl: user.user_metadata.linkedin_url
      };
    }
    return {};
  };

  useEffect(() => {
    if (user && !showOnboarding && !showLinkedInConfirm) {
      navigate(redirectPath);
    }
  }, [user, navigate, showOnboarding, showLinkedInConfirm, redirectPath]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);
    if (!result.error) {
      navigate(redirectPath);
    }
  };

  const handleLinkedInSignIn = async () => {
    const redirectTo = inviteCode 
      ? `${window.location.origin}/invite/${inviteCode}`
      : `${window.location.origin}/`;
    
    const result = await signInWithLinkedIn(redirectTo);
  };

  // Show LinkedIn confirmation if coming from LinkedIn OAuth
  if (showLinkedInConfirm) {
    const linkedInData = getLinkedInData();
    return (
      <LinkedInConfirmation 
        linkedInData={linkedInData}
        onComplete={() => navigate(redirectPath)}
      />
    );
  }

  // Show onboarding if requested
  if (showOnboarding) {
    return <ManualOnboarding />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative">
      {/* Login button in top right corner */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLogin(!showLogin)}
          className="gap-2"
        >
          <LogIn className="w-4 h-4" />
          {showLogin ? 'Cancel' : 'Login'}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ripl
            </h1>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Join a Cowork Session</h2>
          <p className="text-sm text-muted-foreground">
            Connect with focused professionals at cafés
          </p>
        </div>

        {showLogin ? (
          /* Login Form */
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleLinkedInSignIn}
                className="w-full"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                Continue with LinkedIn
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Main Auth Options */
          <div className="space-y-4">
            {/* Primary LinkedIn CTA */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Linkedin className="w-6 h-6 text-primary" />
                  Connect with LinkedIn
                </CardTitle>
                <CardDescription>
                  Get started instantly with your professional profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLinkedInSignIn}
                  size="lg"
                  className="w-full"
                >
                  <Linkedin className="w-5 h-5 mr-2" />
                  Continue with LinkedIn
                </Button>
              </CardContent>
            </Card>

            {/* Manual Signup - Smaller */}
            <Card className="opacity-80 hover:opacity-100 transition-opacity">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Manual Setup</CardTitle>
                <CardDescription className="text-sm">
                  Create your profile step by step
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => navigate('/auth/onboarding')}
                >
                  Start Manual Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;