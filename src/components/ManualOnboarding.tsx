import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Briefcase, Camera, Upload, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics, ANALYTICS_EVENTS } from "@/hooks/useAnalytics";
import { toast } from "@/hooks/use-toast";
import { ProfilePreviewCard } from "./ProfilePreviewCard";

interface OnboardingData {
  name: string;
  title: string;
  avatarUrl: string;
  step: number;
}

interface ManualOnboardingProps {
  onComplete?: () => void;
}

// Step definitions - Name, Title, Photo
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
  }
];

const STORAGE_KEY = 'ripl_onboarding_progress';

const ManualOnboarding = ({ onComplete }: ManualOnboardingProps) => {
  const { user, enrichProfileFromAuth } = useAuth();
  const { track } = useAnalytics();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: user?.user_metadata?.name || user?.user_metadata?.full_name || '',
    title: user?.user_metadata?.headline || '',
    avatarUrl: user?.user_metadata?.picture || '',
    step: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize data from user metadata if available
  useEffect(() => {
    if (user) {
      setData(prev => ({
        ...prev,
        name: user.user_metadata?.name || user.user_metadata?.full_name || prev.name,
        title: user.user_metadata?.headline || prev.title,
        avatarUrl: user.user_metadata?.picture || prev.avatarUrl,
      }));
    }
  }, [user]);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setData(prev => ({ ...prev, ...parsed }));
        setStep(parsed.step || 0);
      } catch (error) {
        console.error('Failed to parse saved onboarding progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    const dataToSave = { ...data, step };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [data, step]);

  const validateStep = (stepId: string): { isValid: boolean; error?: string } => {
    switch (stepId) {
      case 'name':
        if (!data.name.trim()) {
          return { isValid: false, error: 'Name is required' };
        }
        return { isValid: true };
      case 'title':
        // Title is optional for manual onboarding
        return { isValid: true };
      case 'photo':
        // Photo is optional for manual onboarding
        return { isValid: true };
      default:
        return { isValid: true };
    }
  };

  const handleNext = async () => {
    const currentStep = STEPS[step];
    
    if (step === STEPS.length - 1) {
      // Last step - complete onboarding
      await handleComplete();
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

      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate('/auth');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

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
        description: "Please sign in first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 ManualOnboarding: Completing profile setup', { data });
      
      await enrichProfileFromAuth(user, {
        name: data.name,
        title: data.title,
        avatarUrl: data.avatarUrl,
        email: user.email
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

      // Call completion handler
      if (onComplete) {
        onComplete();
      } else {
        const inviteCode = searchParams.get('invite');
        const redirectPath = inviteCode ? `/invite/${inviteCode}` : '/';
        navigate(redirectPath);
      }

    } catch (error: any) {
      console.error('Profile setup error:', error);
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
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Fill out your profile to get started with Ripl
            </p>
          </div>

          {/* Compact Profile Preview */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-2">Your Profile Card</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This is how others will see you in sessions
            </p>
            <ProfilePreviewCard
              name={data.name || "Your Name"}
              title={data.title || "Your Title"}
              avatarUrl={data.avatarUrl}
            />
          </div>

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
                      Title or Role (Optional)
                    </Label>
                    <Input
                      id="title"
                      value={data.title}
                      onChange={(e) => setData({ ...data, title: e.target.value })}
                      placeholder="e.g., Software Engineer, Designer, Student"
                      className="mt-1"
                      maxLength={30}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground ml-auto">
                        {data.title.length}/30 characters
                      </p>
                    </div>
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

              {/* Navigation */}
              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    'Processing...'
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