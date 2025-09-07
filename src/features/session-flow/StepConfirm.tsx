import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Coffee, MapPin, Calendar, Clock, User } from 'lucide-react';
import { useSessionFlowStore } from './store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createUniqueSlug } from './helpers/slug';
import { formatDateForDisplay, formatTimeForDisplay } from './helpers/date';
import { toast } from '@/hooks/use-toast';

export const StepConfirm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCafe, selectedDate, selectedTime, setSessionData } = useSessionFlowStore();
  const [creating, setCreating] = useState(false);

  const handleBack = () => {
    navigate('/create-session/time');
  };

  const handleCreate = async () => {
    if (!user || !selectedCafe || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please complete all steps first.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    
    try {
      // Get user's first name for auto-title
      const firstName = user.user_metadata?.name?.split(' ')[0] || 
                       user.user_metadata?.full_name?.split(' ')[0] || 
                       user.email?.split('@')[0] || 
                       'Friend';
      
      const title = `Coworking with ${firstName}`;
      
      // Create unique slug
      const baseSlug = `${firstName.toLowerCase()}-${Date.now()}`;
      const slug = await createUniqueSlug(baseSlug);
      
      // Find or create venue
      let venueId: string;
      
      // For now, create a simple venue record (in real app, this would use Google Places)
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: selectedCafe,
          address: `${selectedCafe} Location`,
          latitude: 37.7749, // Default SF coordinates
          longitude: -122.4194,
          google_place_id: `manual_${Date.now()}`
        })
        .select()
        .single();

      if (venueError) {
        console.error('Error creating venue:', venueError);
        throw venueError;
      }
      
      venueId = venue.id;
      
      // Create session
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2); // Default 2-hour session
      
      const { data: session, error: sessionError } = await supabase
        .from('cowork_sessions')
        .insert({
          title,
          host_id: user.id,
          venue_id: venueId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_private: false,
          invite_code: slug
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw sessionError;
      }

      // Store session data and navigate to success
      setSessionData(title, slug, session.id);
      navigate('/create-session/success');
      
    } catch (error) {
      console.error('Session creation failed:', error);
      toast({
        title: "Failed to create session",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (!selectedCafe || !selectedDate || !selectedTime) {
    navigate('/create-session/cafe');
    return null;
  }

  const firstName = user?.user_metadata?.name?.split(' ')[0] || 
                   user?.user_metadata?.full_name?.split(' ')[0] || 
                   user?.email?.split('@')[0] || 
                   'Friend';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Ready to create your session?
            </CardTitle>
            <p className="text-muted-foreground">
              Review your details and create your coworking session
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Session Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Coworking with {firstName}</p>
                  <p className="text-sm text-muted-foreground">Auto-generated title</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{selectedCafe}</p>
                  <p className="text-sm text-muted-foreground">Venue</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{formatDateForDisplay(selectedDate)}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{formatTimeForDisplay(selectedTime)}</p>
                  <p className="text-sm text-muted-foreground">Start time (2 hours duration)</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center space-y-2">
              <Badge variant="secondary" className="text-sm">
                Public Session
              </Badge>
              <p className="text-xs text-muted-foreground">
                Anyone with the link can join your session
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleBack}
                disabled={creating}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 h-12"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
                {creating ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};