import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, User, Briefcase, Mail, Camera, Upload, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics, ANALYTICS_EVENTS } from "@/hooks/useAnalytics";
import { toast } from "@/hooks/use-toast";
import { ProfilePreviewCard } from "./ProfilePreviewCard";

interface OnboardingData {
  name: string;
  title: string;
  email: string;
  avatarUrl: string;
  step: number;
}

interface ManualOnboardingProps {
  onComplete?: () => void;
}

// Step definitions - reordered: Name, Title, Photo, Email
const STEPS = [
  {
    id: 'name',
    name: 'Name',
    icon: User,
    description: 'Tell us your name'
  },
  {
    id: 'title',
    name: 'Title',
    icon: Briefcase,
    description: 'What\'s your role or title?'
  },
  {
    id: 'photo',
    name: 'Photo',
    icon: Camera,
    description: 'Add your profile photo'
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    description: 'Save your profile'
  }
];

const STORAGE_KEY = 'ripl_onboarding_progress';

const ManualOnboarding = ({ onComplete }: ManualOnboardingProps) => {
  const { user, signInWithMagicLink, enrichProfileFromAuth } = useAuth();
  const { track } = useAnalytics();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    title: '',
    email: '',
    avatarUrl: '',
    step: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    console.debug('[ONBOARDING] Load saved progress', { hasSaved: !!savedProgress, savedRaw: savedProgress });
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setData(parsed);
        setStep(parsed.step || 0);
        console.debug('[ONBOARDING] Loaded progress', { parsed });
      } catch (error) {
        console.error('Failed to parse saved onboarding progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    const dataToSave = { ...data, step };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.debug('[ONBOARDING] Saved progress', { dataToSave });
  }, [data, step]);

  // Handle magic link return and complete onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verify = urlParams.get('verify');
    const emailParam = urlParams.get('email');
    
    if (verify === 'true' && user && emailParam) {
      console.debug('[ONBOARDING] Verification detected', {
        userId: user.id,
        email: emailParam,
        saved: localStorage.getItem(`ripl_onboarding_${emailParam}`)
      });
      
      // Load saved onboarding data from localStorage
      const savedData = localStorage.getItem(`ripl_onboarding_${emailParam}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.debug('[ONBOARDING] Loaded saved data after magic link', { parsedData });
          setData(parsedData);
          // Clean up the specific email storage key
          localStorage.removeItem(`ripl_onboarding_${emailParam}`);
        } catch (error) {
          console.error('Failed to parse saved onboarding data:', error);
        }
      }
      
      handleEmailVerified();
    }
  }, [user]);

  const handleEmailVerified = async () => {
    if (!user) return;
    
    try {
      console.debug('[ONBOARDING] Upserting user email after verification', {
        userId: user.id,
        email: data.email
      });
      // Call upsert_user_email to mark as verified
      const { error } = await supabase.rpc('upsert_user_email', {
        email: data.email,
        source: 'manual'
      });

      if (error) {
        console.error('Error upserting user email:', error);
        toast({
          title: "Email verification error",
          description: "Failed to verify email. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.debug('[ONBOARDING] Email verified RPC success');
      toast({
        title: "Email verified!",
        description: "Your email has been verified successfully."
      });

      // Don't call handleComplete automatically - wait for user to have their data loaded
      // The useEffect above will have loaded the data from localStorage
      console.debug('[ONBOARDING] Email verified, data should be loaded:', { data });
      
      // Give a moment for the data to be set, then complete
      setTimeout(() => {
        handleComplete();
      }, 500);
    } catch (error) {
      console.error('Error in handleEmailVerified:', error);
      toast({
        title: "Verification error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validateStep = (stepId: string): { isValid: boolean; error?: string } => {
    switch (stepId) {
      case 'name':
        if (!data.name.trim()) {
          return { isValid: false, error: 'Name is required' };
        }
        return { isValid: true };
      case 'title':
        if (!data.title.trim()) {
          return { isValid: false, error: 'Title is required' };
        }
        return { isValid: true };
      case 'photo':
        // Photo is optional
        return { isValid: true };
      case 'email':
        if (!data.email.trim()) {
          return { isValid: false, error: 'Email is required' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          return { isValid: false, error: 'Please enter a valid email address' };
        }
        return { isValid: true };
      default:
        return { isValid: true };
    }
  };

  const handleNext = async () => {
    const currentStep = STEPS[step];
    
    if (currentStep.id === 'email') {
      // Email step - always allow clicking the button
      const validation = validateStep(currentStep.id);
      
      if (!validation.isValid) {
        setErrors({ ...errors, [currentStep.id]: validation.error || '' });
        return;
      }

      // Clear any existing errors
      setErrors({ ...errors, [currentStep.id]: '' });

      // Save onboarding data to localStorage before sending magic link
      const onboardingData = {
        name: data.name,
        title: data.title,
        avatarUrl: data.avatarUrl,
        email: data.email
      };
      localStorage.setItem(`ripl_onboarding_${data.email}`, JSON.stringify(onboardingData));
      console.debug('[ONBOARDING] Saved data to localStorage before magic link', { onboardingData });

      // Send magic link for email verification
      setLoading(true);
      try {
        const redirectUrl = `${window.location.origin}/auth/onboarding?verify=true&email=${encodeURIComponent(data.email)}`;
        console.debug('[ONBOARDING] Sending magic link', { email: data.email, redirectUrl });
        const { error } = await signInWithMagicLink(data.email, redirectUrl);

        if (error) throw error;

        track(ANALYTICS_EVENTS.MAGIC_LINK_SENT, {
          email: data.email
        });

        setEmailSent(true);

        toast({
          title: "Check your email",
          description: "We've sent you a verification link to complete your profile setup."
        });

      } catch (error) {
        console.error('Error sending magic link:', error);
        toast({
          title: "Error sending email",
          description: "Please try again or contact support.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Regular step validation
      const validation = validateStep(currentStep.id);
      
      if (!validation.isValid) {
        setErrors({ ...errors, [currentStep.id]: validation.error || '' });
        return;
      }

      // Clear any existing errors for this step
      setErrors({ ...errors, [currentStep.id]: '' });

      // Track step completion
      track(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
        step_number: step + 1,
        step_name: currentStep.name
      });

      if (step < STEPS.length - 1) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For onboarding, we need to create a temporary anonymous upload since user isn't authenticated yet
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `temp/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      console.debug('[ONBOARDING] Uploading temp avatar', { fileName });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast({ title: "Photo uploaded successfully!" });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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
      console.debug('[ONBOARDING] handleComplete start', { userId: user.id, data });
      let finalAvatarUrl = data.avatarUrl;
      
      // If we have a temp avatar, copy it to the user's permanent location
      if (data.avatarUrl && data.avatarUrl.includes('temp/')) {
        try {
          const tempPath = data.avatarUrl.split('/avatars/')[1];
          const fileExt = tempPath.split('.').pop();
          const newPath = `${user.id}/avatar.${fileExt}`;
          console.debug('[ONBOARDING] Copying avatar from temp', { tempPath, newPath });
          
          // Copy from temp to user folder
          const { error: copyError } = await supabase.storage
            .from('avatars')
            .copy(tempPath, newPath);
            
          if (!copyError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(newPath);
            finalAvatarUrl = publicUrl;
            
            // Clean up temp file
            await supabase.storage.from('avatars').remove([tempPath]);
          }
        } catch (copyError) {
          console.error('Error copying temp avatar:', copyError);
          // Continue with temp URL if copy fails
        }
      }

      console.debug('[ONBOARDING] Calling enrichProfileFromAuth', {
        payload: { name: data.name, title: data.title, avatarUrl: finalAvatarUrl, email: data.email }
      });
      await enrichProfileFromAuth(user, {
        name: data.name,
        title: data.title,
        avatarUrl: finalAvatarUrl,
        email: data.email
      });

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      // Track completion
      track(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        name: data.name,
        has_title: !!data.title,
        has_photo: !!data.avatarUrl
      });

      toast({
        title: "Welcome to Ripl!",
        description: "Your profile has been set up successfully."
      });

      // Call completion handler if provided, otherwise navigate
      if (onComplete) {
        onComplete();
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        navigate(redirect || '/');
      }

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Setup failed",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = STEPS[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Compact Profile Preview */}
          <ProfilePreviewCard
            name={data.name}
            title={data.title}
            avatarUrl={data.avatarUrl}
            linkedinUrl={data.email ? `mailto:${data.email}` : undefined}
          />

          {/* Form Card */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <currentStepData.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{currentStepData.name}</CardTitle>
                  <CardDescription className="text-sm">{currentStepData.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dynamic form content based on current step */}
              {currentStepData.id === 'name' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      placeholder="Enter your name"
                      className="mt-1"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is how others will see your name in sessions.
                  </p>
                </div>
              )}

              {currentStepData.id === 'title' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title or Role *
                    </Label>
                    <Input
                      id="title"
                      value={data.title}
                      onChange={(e) => setData({ ...data, title: e.target.value })}
                      placeholder="e.g., Software Engineer, Designer, Student"
                      className="mt-1"
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive mt-1">{errors.title}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Help others understand what you do.
                  </p>
                </div>
              )}

              {currentStepData.id === 'photo' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Profile Photo (Optional)
                    </Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={data.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {data.name 
                            ? data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : 'YN'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <input
                          type="file"
                          id="photo-upload"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          disabled={uploading}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : data.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        {errors.photo && (
                          <p className="text-sm text-destructive">{errors.photo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add a photo to help others recognize you in sessions.
                  </p>
                </div>
              )}

              {currentStepData.id === 'email' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification link to complete your profile.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-6">
                {step > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={currentStepData.id === 'email' && emailSent}
                  className="flex-1"
                  variant={currentStepData.id === 'email' && emailSent ? "secondary" : "default"}
                >
                  {loading ? (
                    'Processing...'
                  ) : currentStepData.id === 'email' ? (
                    emailSent ? 'Check your inbox' : 'Validate your email'
                  ) : step === STEPS.length - 1 ? (
                    'Complete Setup'
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Step Indicators */}
      <div className="p-4">
        <div className="flex justify-center space-x-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === step
                  ? 'bg-primary'
                  : index < step
                  ? 'bg-accent'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManualOnboarding;