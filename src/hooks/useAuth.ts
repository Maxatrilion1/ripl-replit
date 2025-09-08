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
    console.log('🔐 DEBUG: useAuth setting up auth state listener...');
    console.log('🔐 DEBUG: Current URL when useAuth initializes:', window.location.href);
    console.log('🔐 DEBUG: URL hash contains access_token:', window.location.hash.includes('access_token'));
    console.log('🔐 DEBUG: URL search params:', window.location.search);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 DEBUG: Auth state changed', {
          event,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          accessToken: session?.access_token?.substring(0, 20) + '...',
          refreshToken: session?.refresh_token?.substring(0, 20) + '...',
          currentURL: window.location.href,
          userMetadata: session?.user?.user_metadata,
          appMetadata: session?.user?.app_metadata,
          provider: session?.user?.app_metadata?.provider
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ DEBUG: useAuth error getting session:', error);
        console.error('❌ DEBUG: Session error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      } else {
        console.log('🔐 DEBUG: useAuth initial session check', {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          currentURL: window.location.href,
          urlHash: window.location.hash,
          urlSearch: window.location.search,
          sessionProvider: session?.user?.app_metadata?.provider,
          userMetadata: session?.user?.user_metadata
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('❌ DEBUG: useAuth session check failed:', err);
      console.error('❌ DEBUG: Session check exception details:', err);
      setLoading(false);
    });

    return () => {
      console.log('🔐 DEBUG: useAuth cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('🔐 DEBUG: Starting email signup for:', email);
    const redirectUrl = `${window.location.origin}/`;
    console.log('🔐 DEBUG: Signup redirect URL:', redirectUrl);
    
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
        console.error('🔐 DEBUG: Signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ DEBUG: Signup successful, magic link sent');
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration."
        });
      }

      return { error };
    } catch (err) {
      console.error('Sign up exception:', err);
      console.error('🔐 DEBUG: Signup exception details:', err);
      toast({
        title: "Sign up failed",
        description: "Please check your details and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 DEBUG: Starting email signin for:', email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        console.error('🔐 DEBUG: Signin error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ DEBUG: Email signin successful');
      }

      return { error };
    } catch (err) {
      console.error('Sign in exception:', err);
      console.error('🔐 DEBUG: Signin exception details:', err);
      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const signInWithLinkedIn = async (redirectTo?: string) => {
    console.log('🔐 DEBUG: Starting LinkedIn signin');
    console.log('🔐 DEBUG: LinkedIn redirect URL:', redirectTo);
    try {
      const finalRedirectTo = redirectTo || `${window.location.origin}/auth?verify=true&method=linkedin`;
      console.log('🔐 DEBUG: Final LinkedIn redirect URL:', finalRedirectTo);
      
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
        console.error('🔐 DEBUG: LinkedIn OAuth error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        toast({
          title: "LinkedIn sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ DEBUG: LinkedIn OAuth initiated successfully');
      }

      return { error };
    } catch (err) {
      console.error('LinkedIn sign in exception:', err);
      console.error('🔐 DEBUG: LinkedIn exception details:', err);
      toast({
        title: "LinkedIn sign in failed",
        description: "Please check your internet connection and try again.",
        variant: "destructive"
      });
      return { error: err as Error };
    }
  };

  const signInAsGuest = async (displayName?: string) => {
    console.log('🔐 DEBUG: Starting guest signin');
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
    
    console.log('🔐 DEBUG: Guest credentials generated:', { email: guestEmail, name: randomName });

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
      console.error('🔐 DEBUG: Guest signup error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      toast({
        title: "Guest sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      console.log('✅ DEBUG: Guest signup successful');
      toast({
        title: "Welcome!",
        description: `You're now signed in as ${randomName}.`
      });
    }

    return { error };
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    console.log('🔐 DEBUG: Starting magic link signin for:', email);
    const finalRedirectTo = redirectTo || `${window.location.origin}/auth?verify=true`;
    console.log('🔐 DEBUG: Magic link redirect URL:', finalRedirectTo);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: finalRedirectTo
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        console.error('🔐 DEBUG: Magic link error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        toast({
          title: "Magic link failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ DEBUG: Magic link sent successfully');
      }

      return { error };
    } catch (err) {
      console.error('Magic link exception:', err);
      console.error('🔐 DEBUG: Magic link exception details:', err);
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