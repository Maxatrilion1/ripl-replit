import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import ManualOnboarding from '@/components/ManualOnboarding';
import LinkedInConfirmation from '@/components/LinkedInConfirmation';
import { Linkedin, Coffee, Mail, CheckCircle } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const { user, loading: authLoading, signInWithMagicLink, signInWithLinkedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Parse URL parameters
  const isVerifyFlow = searchParams.get('verify') === 'true';
  const isLinkedInMethod = searchParams.get('method') === 'linkedin';
  const emailParam = searchParams.get('email');
  const inviteCode = searchParams.get('invite');
  
  console.log('🔐 DEBUG: Auth component state', {
    user: !!user,
    authLoading,
    isVerifyFlow,
    isLinkedInMethod,
    emailParam,
    inviteCode,
    pathname: window.location.pathname,
    fullURL: window.location.href,
    hash: window.location.hash,
    search: window.location.search,
    userMetadata: user?.user_metadata,
    appMetadata: user?.app_metadata,
    origin: window.location.origin,
    hostname: window.location.hostname,
    isDeployed: window.location.hostname !== 'localhost'
  });

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Handle redirects for authenticated users NOT in setup flows
  useEffect(() => {
    if (!authLoading && user && !isVerifyFlow) {
      console.log('🔐 Auth: User authenticated, redirecting to main app');
      console.log('🔐 Auth: User details:', {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        isAnonymous: user.user_metadata?.is_anonymous
      });
      const redirectPath = inviteCode ? `/invite/${inviteCode}` : '/';
      console.log('🔐 Auth: Redirecting to:', redirectPath);
      navigate(redirectPath);
    }
  }, [user, authLoading, isVerifyFlow, navigate, inviteCode]);

  // Show loading while auth is initializing
  if (authLoading) {
    console.log('🔐 Auth: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle verification flows for authenticated users
  if (isVerifyFlow && user) {
    console.log('🔐 Auth: Verification flow detected for authenticated user');
    console.log('🔐 Auth: User provider:', user.app_metadata?.provider);
    console.log('🔐 Auth: Is LinkedIn method:', isLinkedInMethod);
    
    if (isLinkedInMethod) {
      // LinkedIn verification flow
      console.log('🔐 Auth: Starting LinkedIn confirmation flow');
      const linkedInData = {
        name: user.user_metadata?.name || user.user_metadata?.full_name,
        headline: user.user_metadata?.headline,
        picture: user.user_metadata?.picture,
        email: user.email,
        profileUrl: user.user_metadata?.linkedin_url
      };
      console.log('🔐 Auth: LinkedIn data extracted:', linkedInData);
      
      return (
        <LinkedInConfirmation 
          linkedInData={linkedInData}
          onComplete={() => {
            console.log('🔐 Auth: LinkedIn confirmation completed');
            const redirectPath = inviteCode ? `/invite/${inviteCode}` : '/';
            console.log('🔐 Auth: Final redirect path:', redirectPath);
            navigate(redirectPath);
          }}
        />
      );
    } else {
      // Magic link verification flow
      console.log('🔐 Auth: Starting manual onboarding flow');
      return (
        <ManualOnboarding 
          onComplete={() => {
            console.log('🔐 Auth: Manual onboarding completed');
            const redirectPath = inviteCode ? `/invite/${inviteCode}` : '/';
            console.log('🔐 Auth: Final redirect path:', redirectPath);
            navigate(redirectPath);
          }}
        />
      );
    }
  }

  // Show regular auth form for non-authenticated users
  console.log('🔐 Auth: Showing auth form for non-authenticated user');
  
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Auth: Magic link form submitted');
    
    if (!email.trim()) {
      console.log('🔐 Auth: Email is empty, not proceeding');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Build redirect URL for magic link
      const redirectParams = new URLSearchParams();
      redirectParams.set('verify', 'true');
      if (inviteCode) redirectParams.set('invite', inviteCode);
      if (emailParam) redirectParams.set('email', emailParam);
      
      const finalRedirectTo = `${window.location.origin}/auth?${redirectParams.toString()}`;
      
      console.log('🔐 Auth: Sending magic link with redirect:', finalRedirectTo);
      
      const result = await signInWithMagicLink(email, finalRedirectTo);
      if (!result.error) {
        console.log('✅ Auth: Magic link sent successfully');
        setMagicLinkSent(true);
      } else {
        console.error('❌ Auth: Magic link failed:', result.error);
        // Check if it's a rate limit error
        if (result.error.message?.includes('For security purposes, you can only request this after')) {
          const match = result.error.message.match(/after (\d+) seconds/);
          const seconds = match ? parseInt(match[1]) : 60;
          setCooldown(seconds);
          setError(`Please wait ${seconds} seconds before requesting another magic link.`);
        } else {
          setError(result.error.message || 'Failed to send magic link. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    console.log('🔐 Auth: Starting LinkedIn sign-in');
    console.log('🔐 Auth: Current origin:', window.location.origin);
    
    // Build redirect URL for LinkedIn
    const redirectParams = new URLSearchParams();
    redirectParams.set('verify', 'true');
    redirectParams.set('method', 'linkedin');
    if (inviteCode) redirectParams.set('invite', inviteCode);
    
    const redirectTo = `${window.location.origin}/auth?${redirectParams.toString()}`;
    
    console.log('🔐 Auth: LinkedIn redirect URL:', redirectTo);
    
    const result = await signInWithLinkedIn(redirectTo);
    if (result.error) {
      console.error('❌ Auth: LinkedIn signin failed:', result.error);
      setError(result.error.message || 'LinkedIn sign-in failed. Please try again.');
    } else {
      console.log('✅ Auth: LinkedIn signin initiated');
    }
  };

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
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
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
                    disabled={loading || !email.trim() || cooldown > 0}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    ) : cooldown > 0 ? (
                      <span>Wait {cooldown}s</span>
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Continue with Email'}
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