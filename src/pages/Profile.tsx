import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Users, MapPin, Edit } from 'lucide-react';
import AnonymousUpgradePrompt from '@/components/AnonymousUpgradePrompt';
import { ProfilePreviewCard } from '@/components/ProfilePreviewCard';
import { ProfileEditModal } from '@/components/ProfileEditModal';

interface UserProfile {
  name: string | null;
  title: string | null;
  avatar_url: string | null;
  linkedin_profile_url: string | null;
  is_anonymous: boolean;
  virtual_joins_this_month: number;
  virtual_joins_reset_date: string;
  created_at: string;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      return;
    }

    const fetchProfile = async () => {
      if (!user) return;

      try {
        console.debug('[PROFILE] Current user info:', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        });

        // Fetch user profile
        console.debug('[PROFILE] Fetching profile for user:', user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[PROFILE] Error fetching profile:', profileError);
          toast({
            title: "Profile error",
            description: "Failed to load profile data.",
            variant: "destructive"
          });
          return;
        }

        console.debug('[PROFILE] Profile data fetched:', profileData);
        
        if (!profileData) {
          console.warn('[PROFILE] No profile found for user, profile may not have been created');
          
          // Try to create profile from user metadata if missing
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              name: user.user_metadata?.name || user.email || 'User',
              title: user.user_metadata?.title,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              linkedin_profile_url: user.user_metadata?.linkedin_profile_url,
              linkedin_id: user.user_metadata?.linkedin_id || user.user_metadata?.sub
            })
            .select()
            .single();

          if (createError) {
            console.error('[PROFILE] Error creating profile:', createError);
            toast({
              title: "Profile creation failed",
              description: "Could not create your profile. Please try again.",
              variant: "destructive"
            });
            return;
          }

          console.debug('[PROFILE] Created new profile:', newProfile);
          setProfile(newProfile);
          toast({
            title: "Profile created",
            description: "Your profile has been created successfully."
          });
          return;
        }

        setProfile(profileData);

        // Check if user is admin
        const { data: adminData } = await supabase.rpc('is_admin', { uid: user.id });
        setIsAdmin(adminData || false);

      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setAddingAdmin(true);
    
    try {
      const { data, error } = await supabase.rpc('add_admin_by_email', {
        email: adminEmail.trim()
      });

      if (error) {
        console.error('❌ ADMIN AUDIT: Failed to add admin:', adminEmail, 'Error:', error);
        toast({
          title: "Failed to add admin",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ ADMIN AUDIT: Successfully added admin:', adminEmail, 'User ID:', data);
      toast({
        title: "Admin added successfully",
        description: `${adminEmail} has been granted admin privileges.`
      });
      
      setAdminEmail('');
    } catch (error: any) {
      console.error('❌ ADMIN AUDIT: Exception adding admin:', adminEmail, 'Error:', error);
      toast({
        title: "Error adding admin",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="space-y-4">
          <div className="w-full max-w-sm mx-auto h-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        {/* Profile Card */}
        {loading ? (
          <div className="space-y-4">
            <div className="w-full max-w-sm mx-auto h-24 bg-muted rounded-lg animate-pulse" />
          </div>
        ) : !profile ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Profile not found. Please try signing out and back in.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Profile Preview with Edit Button */}
            <div className="relative">
            <ProfilePreviewCard
              name={profile.name}
              title={profile.title}
              avatarUrl={profile.avatar_url}
              linkedinUrl={profile.linkedin_profile_url}
            />
              <Button
                onClick={() => setEditModalOpen(true)}
                size="sm"
                className="absolute top-2 right-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>

            {/* Profile Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-around text-center">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{profile.virtual_joins_this_month} joins this month</span>
                  </div>
                </div>
                {profile.is_anonymous && (
                  <div className="mt-4 pt-4 border-t">
                    <Badge variant="secondary" className="w-full justify-center">
                      Guest Account
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {profile?.is_anonymous && (
          <AnonymousUpgradePrompt 
            feature="Profile Management"
            description="Upgrade to a full account to access all profile features and join unlimited sessions."
          />
        )}

        {/* Admin Section */}
        {isAdmin && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                Admin Tools
              </CardTitle>
              <CardDescription>
                Administrative functions and user management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Add Administrator</h3>
                <form onSubmit={handleAddAdmin} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="email"
                        placeholder="Enter email address to grant admin access"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        disabled={addingAdmin}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={addingAdmin || !adminEmail.trim()}
                    >
                      {addingAdmin ? 'Adding...' : 'Add Admin'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The user must have an existing account with this email address.
                  </p>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Edit Modal */}
        {profile && (
          <ProfileEditModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            profile={profile}
            onProfileUpdate={setProfile}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;