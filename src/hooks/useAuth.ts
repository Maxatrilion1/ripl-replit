import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfileData {
  name?: string;
  title?: string;
  avatarUrl?: string;
  linkedinUrl?: string | null;
  linkedinId?: string;
  email?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 useAuth: Hook initializing...');

  useEffect(() => {
    console.log('🔐 useAuth: Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 useAuth: Auth state changed', {
          event,
          hasUser: !!session?.user,
          userId: session?.user?.id,
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ useAuth: Error getting session:', error);
      } else {
        console.log('🔐 useAuth: Initial session check', {
          hasSession: !!session,
          userId: session?.user?.id,
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('❌ useAuth: Session check failed:', err);
      setLoading(false);
    });

    return () => {
      console.log('🔐 useAuth: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: displayName
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration."
        });
      }

      return { error };
    } catch (err) {
      console.error('Sign up exception:', err);
      toast({
        title: "Sign up failed",
        description: "Please check your details and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (err) {
      console.error('Sign in exception:', err);
      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const signInWithLinkedIn = async (redirectTo?: string) => {
    try {
      const finalRedirectTo = redirectTo || `${window.location.origin}/auth?verify=true&method=linkedin`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: finalRedirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('LinkedIn OAuth error:', error);
        toast({
          title: "LinkedIn sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (err) {
      console.error('LinkedIn sign in exception:', err);
      toast({
        title: "LinkedIn sign in failed",
        description: "Please check your internet connection and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const signInAsGuest = async (displayName?: string) => {
    const anonymousNames = [
      'Disguised Duck',
      'Private Platypus', 
      'Masked Minnow',
      'Hidden Heron',
      'Camouflaged Carp',
      'Unknown Toad',
      'Silent Swan',
      'Mysterious Muskrat',
      'Unnamed Newt',
      'Incognito Frog'
    ];
    
    const randomName = displayName || anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
    const guestEmail = `guest.${Date.now()}@ripl.guest`;
    const guestPassword = `Guest${Math.random().toString(36).slice(-8)}!`;

    const { error } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: randomName,
          is_anonymous: true
        }
      }
    });

    if (error) {
      console.error('Guest sign up error:', error);
      toast({
        title: "Guest sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome!",
        description: `You're now signed in as ${randomName}.`
      });
    }

    return { error };
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    const finalRedirectTo = redirectTo || `${window.location.origin}/auth?verify=true`;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: finalRedirectTo
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        toast({
          title: "Magic link failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (err) {
      console.error('Magic link exception:', err);
      toast({
        title: "Magic link failed", 
        description: "Please check your email and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const enrichProfileFromAuth = async (user: User, profileData: ProfileData) => {
    console.log('🔐 useAuth: Enriching profile from auth data');
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profileData.name || user.email || 'User',
          title: profileData.title,
          avatar_url: profileData.avatarUrl,
          linkedin_profile_url: profileData.linkedinUrl,
          linkedin_id: profileData.linkedinId
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        throw profileError;
      }

      console.log('✅ useAuth: Profile enriched successfully');
    } catch (error) {
      console.error('❌ useAuth: Profile enrichment failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
    
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithLinkedIn,
    signInAsGuest,
    signInWithMagicLink,
    enrichProfileFromAuth,
    signOut
  };
};