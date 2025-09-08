import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Linkedin, Check, AlertCircle } from 'lucide-react';
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
  onComplete: () => void;
}

const LinkedInConfirmation = ({ linkedInData, onComplete }: LinkedInConfirmationProps) => {
  const { user, enrichProfileFromAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  console.log('🔗 LinkedInConfirmation: Component loaded', {
    user: !!user,
    linkedInData,
    userMetadata: user?.user_metadata
  });

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔗 LinkedInConfirmation: Completing LinkedIn setup', {
        userId: user.id,
        linkedInData,
        userMetadata: user.user_metadata
      });

      // Extract LinkedIn profile URL from user metadata
      const linkedinId = user.user_metadata?.sub;
      let linkedinUrl = null;
      
      // Try to construct LinkedIn URL from the provider subject ID
      if (linkedinId) {
        linkedinUrl = `https://linkedin.com/in/${linkedinId}`;
      }

      // Download and store LinkedIn profile picture if available
      let avatarUrl = user.user_metadata?.picture;
      if (avatarUrl) {
        try {
          console.log('🔗 LinkedInConfirmation: Downloading LinkedIn profile picture');
          
          const response = await fetch(avatarUrl);
          if (response.ok) {
            const blob = await response.blob();
            const fileExt = avatarUrl.includes('.jpg') ? 'jpg' : 'png';
            const fileName = `${user.id}/linkedin-avatar.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, { upsert: true });
              
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              avatarUrl = publicUrl;
              console.log('🔗 LinkedInConfirmation: Successfully stored LinkedIn avatar');
            }
          }
        } catch (downloadError) {
          console.error('Error downloading LinkedIn profile picture:', downloadError);
          // Continue with original URL if download fails
        }
      }
      
      await enrichProfileFromAuth(user, {
        name: user.user_metadata?.name || user.user_metadata?.full_name,
        title: user.user_metadata?.headline,
        avatarUrl: avatarUrl,
        linkedinId: linkedinId,
        linkedinUrl: linkedinUrl,
        email: user.email
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl">LinkedIn Import</CardTitle>
          </div>
          <CardDescription>
            Confirm your LinkedIn profile details
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Preview */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={linkedInData.picture || user?.user_metadata?.picture} />
                  <AvatarFallback className="text-lg bg-primary/10">
                    {(linkedInData.name || user?.user_metadata?.name)?.[0] || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {linkedInData.name || user?.user_metadata?.name || 'LinkedIn User'}
                  </h3>
                  {(linkedInData.headline || user?.user_metadata?.headline) && (
                    <p className="text-sm text-muted-foreground">
                      {linkedInData.headline || user?.user_metadata?.headline}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {linkedInData.email || user?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Complete Setup
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              disabled={loading}
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