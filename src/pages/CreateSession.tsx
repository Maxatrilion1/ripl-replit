import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, MapPin, Coffee, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics, ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import VenueTestPanel from '@/components/VenueTestPanel';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Place {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
}

interface SelectedVenue {
  venue_id: string; // Database UUID
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
}

const CreateSession = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [venues, setVenues] = useState<Place[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<SelectedVenue | null>(null);
  const [searchingVenues, setSearchingVenues] = useState(false);
  const [creating, setCreating] = useState(false);

  const { user } = useAuth();
  const { track } = useAnalytics();
  const navigate = useNavigate();

  const searchVenues = async () => {
    if (!venueSearch.trim()) return;
    
    console.log('🔍 CreateSession: Searching venues for:', venueSearch);
    setSearchingVenues(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query: `${venueSearch} coffee shop cafe` }
      });

      if (error) {
        console.error('❌ CreateSession: Venue search error:', error);
        throw error;
      }
      
      console.log('✅ CreateSession: Found', data?.places?.length || 0, 'venues');
      setVenues(data.places || []);
    } catch (error) {
      console.error('❌ CreateSession: Venue search failed:', error);
      toast({
        title: "Search failed",
        description: "Could not search for venues. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearchingVenues(false);
    }
  };

  const selectVenue = async (place: Place) => {
    console.log('🏢 CreateSession: Selecting venue:', place.name);
    console.log('🔐 CreateSession: User auth state:', { 
      userId: user?.id, 
      isAuthenticated: !!user,
      userEmail: user?.email 
    });

    if (!user) {
      console.error('❌ CreateSession: User not authenticated');
      toast({
        title: "Authentication required",
        description: "Please log in to select a venue.",
        variant: "destructive"
      });
      return;
    }

    try {
      // First check if venue exists
      console.log('🔍 CreateSession: Checking if venue exists...');
      const { data: existingVenue, error: selectError } = await supabase
        .from('venues')
        .select('*')
        .eq('google_place_id', place.place_id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data

      if (selectError) {
        console.error('❌ CreateSession: Error checking existing venue:', selectError);
        throw selectError;
      }

      let venueId;
      if (existingVenue) {
        console.log('✅ CreateSession: Using existing venue:', existingVenue.id);
        venueId = existingVenue.id;
      } else {
        console.log('➕ CreateSession: Creating new venue with user ID:', user.id);
        
        // Verify authentication before insertion
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('❌ CreateSession: Session verification failed:', sessionError);
          throw new Error('Authentication session invalid. Please log in again.');
        }
        
        console.log('✅ CreateSession: Session verified, inserting venue...');
        
        // Create new venue
        const { data: newVenue, error } = await supabase
          .from('venues')
          .insert({
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            google_place_id: place.place_id,
            photo_url: place.photo_url
          })
          .select()
          .single();

        if (error) {
          console.error('❌ CreateSession: Venue creation error details:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          if (error.code === '42501') {
            throw new Error('Permission denied. Please ensure you are logged in and try again.');
          }
          throw error;
        }
        console.log('✅ CreateSession: Created new venue:', newVenue.id);
        venueId = newVenue.id;
      }

      setSelectedVenue({
        venue_id: venueId,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        photo_url: place.photo_url
      });
      setVenues([]);
      setVenueSearch('');
      console.log('✅ CreateSession: Venue selected successfully');
    } catch (error) {
      console.error('❌ CreateSession: Venue selection failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Could not select venue. Please try again.';
      
      toast({
        title: "Error selecting venue",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const validateTimes = () => {
    if (!startTime || !endTime) return true; // Let HTML5 required handle empty fields
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 CreateSession: Starting session creation...');
    
    // Validate required fields
    if (!user || !selectedVenue || !title || !startTime || !endTime) {
      console.warn('⚠️ CreateSession: Missing required fields');
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a venue.",
        variant: "destructive"
      });
      return;
    }

    // Validate time range
    if (!validateTimes()) {
      console.warn('⚠️ CreateSession: Invalid time range');
      return;
    }

    setCreating(true);
    
    try {
      console.log('💾 CreateSession: Inserting session into database...');
      const { data, error } = await supabase
        .from('cowork_sessions')
        .insert({
          title,
          description,
          host_id: user.id,
          venue_id: selectedVenue.venue_id,
          start_time: startTime,
          end_time: endTime,
          is_private: false, // All sessions are public
          invite_code: '' // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (error) {
        console.error('❌ CreateSession: Database error:', error);
        throw error;
      }

      console.log('✅ CreateSession: Session created successfully:', data.id);

      toast({
        title: "Session created!",
        description: "Your cowork session has been created successfully."
      });

      navigate(`/sessions/${data.id}`);
    } catch (error) {
      console.error('❌ CreateSession: Session creation failed:', error);
      toast({
        title: "Failed to create session",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getTomorrowEndDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Work Session
            </h1>
          </div>
          <p className="text-muted-foreground">
            Set up a focused work session at your favorite café
          </p>
        </div>

        {/* QA Testing Panel - Only show for developers/testing */}
        {process.env.NODE_ENV === 'development' && <VenueTestPanel />}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Session Details
            </CardTitle>
            <CardDescription>
              Tell people what you'll be working on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSession} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  placeholder="Morning Focus Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Working on my startup pitch deck. Join for quiet focus time!"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Venue Search */}
              <div className="space-y-2">
                <Label>Choose a Café</Label>
                {selectedVenue ? (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedVenue.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedVenue.address}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVenue(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search for cafés..."
                        value={venueSearch}
                        onChange={(e) => setVenueSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchVenues())}
                      />
                      <Button
                        type="button"
                        onClick={searchVenues}
                        disabled={searchingVenues || !venueSearch.trim()}
                      >
                        {searchingVenues ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    
                    {venues.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {venues.map((venue) => (
                          <button
                            key={venue.place_id}
                            type="button"
                            onClick={() => selectVenue(venue)}
                            className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-primary" />
                            <div className="flex-1 text-left">
                              <p className="font-medium">{venue.name}</p>
                              <p className="text-sm text-muted-foreground">{venue.address}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={getTomorrowDate()}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    min={startTime || getTomorrowEndDate()}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={creating || !selectedVenue || !title || !startTime || !endTime}
              >
                {creating ? 'Creating Session...' : 'Create Session'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateSession;