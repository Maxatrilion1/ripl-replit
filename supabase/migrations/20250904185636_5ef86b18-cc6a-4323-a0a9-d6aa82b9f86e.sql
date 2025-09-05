-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enums for identity and email management
CREATE TYPE public.app_identity_provider AS ENUM ('anonymous', 'manual', 'linkedin');
CREATE TYPE public.email_source AS ENUM ('manual', 'linkedin');

-- Add columns to profiles table for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS title TEXT CHECK (length(title) <= 30),
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/placeholder.svg';

-- Create user_emails table for email management and verification
CREATE TABLE public.user_emails (
    user_id UUID NOT NULL,
    email_normalized CITEXT NOT NULL UNIQUE,
    email_hash TEXT NOT NULL,
    email_salt TEXT NOT NULL,
    verified_at TIMESTAMPTZ,
    source email_source NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, email_normalized)
);

-- Create user_identities table for tracking auth providers
CREATE TABLE public.user_identities (
    user_id UUID NOT NULL,
    provider app_identity_provider NOT NULL,
    provider_subject TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, provider)
);

-- Enable RLS on new tables
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

-- Create helper function to check admin status (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = uid
  )
$$;

-- Grant execute on admin helper to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Create function to get session preview (accessible to anonymous users)
CREATE OR REPLACE FUNCTION public.get_session_preview(invite_code TEXT)
RETURNS TABLE (
    session_id UUID,
    title TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    venue_name TEXT,
    host_display_name TEXT,
    host_avatar_url TEXT,
    attendee_avatars TEXT[]
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH session_info AS (
    SELECT 
      cs.id,
      cs.title,
      cs.start_time,
      cs.end_time,
      v.name as venue_name,
      p.display_name as host_display_name,
      p.avatar_url as host_avatar_url
    FROM public.cowork_sessions cs
    JOIN public.venues v ON cs.venue_id = v.id
    JOIN public.profiles p ON cs.host_id = p.user_id
    WHERE cs.invite_code = get_session_preview.invite_code
  ),
  attendee_photos AS (
    SELECT array_agg(p.avatar_url ORDER BY random()) FILTER (WHERE p.avatar_url IS NOT NULL) as avatars
    FROM public.session_members sm
    JOIN public.profiles p ON sm.user_id = p.user_id
    WHERE sm.session_id = (SELECT id FROM session_info)
    AND NOT p.is_anonymous
  )
  SELECT 
    si.id,
    si.title,
    si.start_time,
    si.end_time,
    si.venue_name,
    si.host_display_name,
    si.host_avatar_url,
    COALESCE(
      (SELECT (avatars)[1:6] FROM attendee_photos), 
      ARRAY[]::TEXT[]
    ) as attendee_avatars
  FROM session_info si;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_session_preview TO anon, authenticated;

-- Create function to upsert user email with hashing
CREATE OR REPLACE FUNCTION public.upsert_user_email(email TEXT, source email_source)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    normalized_email CITEXT;
    salt TEXT;
    hash TEXT;
    user_uuid UUID;
BEGIN
    -- Get current user
    user_uuid := auth.uid();
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Normalize email
    normalized_email := lower(trim(email));
    
    -- Generate salt and hash
    salt := encode(gen_random_bytes(32), 'hex');
    hash := encode(digest(normalized_email || salt, 'sha256'), 'hex');
    
    -- Upsert email record
    INSERT INTO public.user_emails (
        user_id, 
        email_normalized, 
        email_hash, 
        email_salt, 
        verified_at, 
        source,
        updated_at
    ) VALUES (
        user_uuid,
        normalized_email,
        hash,
        salt,
        NOW(), -- Mark as verified since called post-login
        source,
        NOW()
    )
    ON CONFLICT (user_id, email_normalized) 
    DO UPDATE SET 
        verified_at = COALESCE(user_emails.verified_at, NOW()),
        source = EXCLUDED.source,
        updated_at = NOW();
        
    RETURN user_uuid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_user_email TO authenticated;

-- Create function to add admin by email (admin-only)
CREATE OR REPLACE FUNCTION public.add_admin_by_email(email TEXT)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    target_user_id UUID;
    calling_user_id UUID;
BEGIN
    -- Check if caller is admin
    calling_user_id := auth.uid();
    IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
        RAISE EXCEPTION 'Only admins can add other admins';
    END IF;
    
    -- Find user by email (case insensitive)
    SELECT au.id INTO target_user_id
    FROM auth.users au
    WHERE lower(au.email) = lower(trim(email))
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', email;
    END IF;
    
    -- Insert into admins table (ignore if already exists)
    INSERT INTO public.admins (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN target_user_id;
END;
$$;

-- Grant execute to authenticated users (function handles admin check internally)
GRANT EXECUTE ON FUNCTION public.add_admin_by_email TO authenticated;

-- RLS Policies for user_emails
CREATE POLICY "Users can view their own emails"
ON public.user_emails FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all emails"
ON public.user_emails FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert their own emails"
ON public.user_emails FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own emails"
ON public.user_emails FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for user_identities
CREATE POLICY "Users can view their own identities"
ON public.user_identities FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all identities"
ON public.user_identities FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert their own identities"
ON public.user_identities FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_user_emails_updated_at
    BEFORE UPDATE ON public.user_emails
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_identities_updated_at
    BEFORE UPDATE ON public.user_identities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing triggers for cowork_sessions (invite_code and updated_at)
CREATE TRIGGER set_cowork_sessions_invite_code
    BEFORE INSERT ON public.cowork_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invite_code();

CREATE TRIGGER update_cowork_sessions_updated_at
    BEFORE UPDATE ON public.cowork_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();