import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Linkedin, Mail, Check, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LinkedInData {
  name?: string;
  headline?: string;
  picture?: string;
  email?: string;
  profileUrl?: string;
}

interface LinkedInConfirmationProps {
  linkedInData: LinkedInData;
  existingUser?: boolean; // If user was already signed in
  onComplete: () => void;
}

const LinkedInConfirmation = ({ linkedInData, existingUser, onComplete }: LinkedInConfirmationProps) => {
  const { user, session, signInWithMagicLink, enrichProfileFromAuth } = useAuth();
  
  const copyLinkedInAvatar = async (sourceUrl: string, userId: string): Promise<string> => {
    try {
      // Download the LinkedIn image
      const response = await fetch(sourceUrl);
      const blob = await response.blob();
      
      // Upload to our storage
      const fileName = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error copying LinkedIn avatar:', error);
      return sourceUrl; // Fallback to original URL
    }
  };
  const navigate = useNavigate();
  const [email, setEmail] = useState(linkedInData.email || '');
  const [needsEmail, setNeedsEmail] = useState(!linkedInData.email);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    // If we have email from LinkedIn and user is authenticated, complete the flow
    if (linkedInData.email && user && !existingUser) {
      handleComplete();
    }
  }, [linkedInData.email, user, existingUser]);

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.debug('[LINKEDIN] Sending magic link', { email });
      const { error } = await signInWithMagicLink(email);
      if (error) {
        toast({
          title: "Magic link failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Check your email",
          description: "We've sent you a magic link to verify your email."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in first to link your LinkedIn account.",
        variant: "destructive"
      });
      return;
    }

    setIsLinking(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc'
      });

      if (error) {
        console.error('Account linking error:', error);
        toast({
          title: "Linking failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account linked!",
          description: "Your LinkedIn account has been linked successfully."
        });
        await handleComplete();
      }
    } catch (error: any) {
      console.error('Account linking exception:', error);
      toast({
        title: "Linking failed",
        description: "Failed to link LinkedIn account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please complete email verification first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.debug('[LINKEDIN] Completing with data', { email, linkedInData, userId: user.id });
      // Store email if provided
      if (email) {
        const { error: emailError } = await supabase.rpc('upsert_user_email', {
          email: email,
          source: 'linkedin'
        });

        if (emailError) {
          console.error('Error upserting LinkedIn email:', emailError);
          toast({
            title: "Email error",
            description: "Failed to save email. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // LinkedIn provides: sub, name, given_name, family_name, picture, email
      // Don't look for headline as it doesn't exist
      const linkedinId = user.user_metadata?.sub;
      const profilePicture = user.user_metadata?.picture;
      let avatarUrl = profilePicture;

      // Download and store LinkedIn profile picture if it exists
      if (profilePicture) {
        try {
          console.debug('[LINKEDIN] Downloading LinkedIn profile picture', { profilePicture });
          
          // Download the image
          const response = await fetch(profilePicture);
          if (response.ok) {
            const blob = await response.blob();
            const fileExt = profilePicture.includes('.jpg') ? 'jpg' : 'png';
            const fileName = `${user.id}/linkedin-avatar.${fileExt}`;
            
            // Upload to Supabase storage
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, { upsert: true });
              
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              avatarUrl = publicUrl;
              console.debug('[LINKEDIN] Successfully stored LinkedIn avatar', { avatarUrl });
            }
          }
        } catch (downloadError) {
          console.error('Error downloading LinkedIn profile picture:', downloadError);
          // Continue with original URL if download fails
        }
      }
      
      await enrichProfileFromAuth(user, {
        name: user.user_metadata.name,
        title: null, // LinkedIn OIDC doesn't provide job title
        avatarUrl: avatarUrl,
        linkedinId: linkedinId,
        linkedinUrl: null, // LinkedIn OIDC doesn't provide profile URL
        email: email || linkedInData.email
      });

      toast({
        title: "Welcome to Ripl!",
        description: "Your LinkedIn profile has been imported successfully."
      });

      onComplete();
    } catch (error: any) {
      console.error('LinkedIn completion error:', error);
      toast({
        title: "Setup failed",
        description: "Failed to complete LinkedIn setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-cowork-primary-light/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl">LinkedIn Import</CardTitle>
          </div>
          <CardDescription>
            {existingUser 
              ? 'Link your LinkedIn account to your existing profile'
              : 'Confirm your LinkedIn profile details'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Preview */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={linkedInData.picture} />
                  <AvatarFallback className="text-lg bg-primary/10">
                    {linkedInData.name?.[0] || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {linkedInData.name || 'LinkedIn User'}
                  </h3>
                  {linkedInData.headline && (
                    <p className="text-sm text-muted-foreground">
                      {linkedInData.headline}
                    </p>
                  )}
                  {linkedInData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {linkedInData.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {existingUser && (
                <Alert>
                  <LinkIcon className="h-4 w-4" />
                  <AlertDescription>
                    This will link your LinkedIn account to your existing Ripl profile.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Email Input (if needed) */}
          {needsEmail && !emailSent && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  LinkedIn didn't provide your email. Please enter it to continue.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <Button 
                onClick={handleSendMagicLink}
                disabled={loading || !email.trim()}
                className="w-full"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Verification Email
              </Button>
            </div>
          )}

          {/* Email Sent State */}
          {emailSent && !user && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Check your email and click the magic link to continue.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {existingUser ? (
              <Button
                onClick={handleLinkAccount}
                disabled={isLinking}
                className="w-full"
              >
                {isLinking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                Link LinkedIn Account
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading || (needsEmail && !user)}
                className="w-full"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Complete Setup
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              disabled={loading || isLinking}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInConfirmation;