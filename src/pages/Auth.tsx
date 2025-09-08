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
import { Linkedin, Coffee, Mail, CheckCircle } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, session, signInWithMagicLink, signInWithLinkedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check what flow to show
  const isVerifyFlow = searchParams.get('verify') === 'true';
  const showOnboarding = searchParams.get('method') === 'email' || window.location.pathname === '/auth/onboarding' || isVerifyFlow;
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
    // If user is authenticated and not in a special flow, redirect to main app
    if (user && !showOnboarding && !showLinkedInConfirm && !isVerifyFlow) {
      navigate(redirectPath);
    }
  }, [user, navigate, showOnboarding, showLinkedInConfirm, redirectPath]);

  // Handle magic link verification flow
  useEffect(() => {
    if (isVerifyFlow && user) {
      // User clicked magic link and is now authenticated
      // Check if they need onboarding or can go directly to app
      const hasProfile = user.user_metadata?.name || user.user_metadata?.full_name;
      
      if (!hasProfile) {
        // Show onboarding to complete profile
        return;
      } else {
        // Profile exists, redirect to main app
        navigate(redirectPath);
      }
    }
  }, [isVerifyFlow, user, navigate, redirectPath]);
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }
    
    setLoading(true);
    try {
      // Always redirect to onboarding flow for magic link users
      const finalRedirectTo = `${window.location.origin}/auth/onboarding?verify=true&email=${encodeURIComponent(email)}`;
      
      const result = await signInWithMagicLink(email, finalRedirectTo);
      if (!result.error) {
        setMagicLinkSent(true);
      }
    } finally {
      setLoading(false);
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
          <h2 className="text-lg font-semibold text-foreground">Welcome to Ripl</h2>
          <p className="text-sm text-muted-foreground">
            Connect with focused professionals at cafés
          </p>
        </div>

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

          {/* Magic Link Sign In - Primary Method */}
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">Sign In or Sign Up</CardTitle>
              <CardDescription>
                {magicLinkSent ? 'Check your email for the magic link' : 'Enter your email to get started - no password needed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {magicLinkSent ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Magic link sent!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check your email and click the link to sign in. You can close this tab.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setMagicLinkSent(false);
                      setEmail('');
                    }}
                    className="w-full"
                  >
                    Send to Different Email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email Address</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Sending...' : 'Continue with Email'}
                  </Button>
                </form>
              )}
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
      </div>
    </div>
  );
};

export default Auth;