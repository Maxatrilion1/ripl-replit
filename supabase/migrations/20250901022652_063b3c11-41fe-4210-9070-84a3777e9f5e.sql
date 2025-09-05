-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  linkedin_profile_url TEXT,
  virtual_joins_this_month INTEGER NOT NULL DEFAULT 0,
  virtual_joins_reset_date DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admins table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cowork sessions table
CREATE TABLE public.cowork_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 8,
  is_private BOOLEAN NOT NULL DEFAULT false,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session members table
CREATE TABLE public.session_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cowork_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cowork_sessions(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Focus Sprint',
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sprint participations table
CREATE TABLE public.sprint_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_virtual BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sprint_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('session_join', 'sprint_start', 'session_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  session_id UUID REFERENCES public.cowork_sessions(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cowork_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for admins
CREATE POLICY "Only admins can view admin table" ON public.admins FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- RLS Policies for venues
CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert venues" ON public.venues FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for cowork_sessions
CREATE POLICY "Anyone can view public sessions" ON public.cowork_sessions FOR SELECT USING (is_private = false OR auth.uid() = host_id OR EXISTS (SELECT 1 FROM public.session_members WHERE session_id = cowork_sessions.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create sessions" ON public.cowork_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their sessions" ON public.cowork_sessions FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their sessions" ON public.cowork_sessions FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for session_members
CREATE POLICY "Users can view memberships for sessions they can see" ON public.session_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cowork_sessions WHERE id = session_id AND (is_private = false OR host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.session_members sm WHERE sm.session_id = cowork_sessions.id AND sm.user_id = auth.uid())))
);
CREATE POLICY "Users can join sessions" ON public.session_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave sessions" ON public.session_members FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.cowork_sessions WHERE id = session_id AND host_id = auth.uid()));

-- RLS Policies for sprints
CREATE POLICY "Users can view sprints for sessions they're in" ON public.sprints FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.session_members WHERE session_id = sprints.session_id AND user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM public.cowork_sessions WHERE id = sprints.session_id AND host_id = auth.uid())
);
CREATE POLICY "Session hosts can create sprints" ON public.sprints FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cowork_sessions WHERE id = session_id AND host_id = auth.uid())
);
CREATE POLICY "Sprint starters can update their sprints" ON public.sprints FOR UPDATE USING (auth.uid() = started_by);

-- RLS Policies for sprint_participations
CREATE POLICY "Users can view participations for sprints they can see" ON public.sprint_participations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sprints s JOIN public.session_members sm ON s.session_id = sm.session_id WHERE s.id = sprint_participations.sprint_id AND sm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.sprints s JOIN public.cowork_sessions cs ON s.session_id = cs.id WHERE s.id = sprint_participations.sprint_id AND cs.host_id = auth.uid())
);
CREATE POLICY "Users can join sprint participations" ON public.sprint_participations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participations" ON public.sprint_participations FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cowork_sessions_updated_at BEFORE UPDATE ON public.cowork_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, is_anonymous)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 
    COALESCE((NEW.raw_user_meta_data->>'is_anonymous')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN lower(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invite codes
CREATE OR REPLACE FUNCTION public.set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invite_code_trigger BEFORE INSERT ON public.cowork_sessions FOR EACH ROW EXECUTE FUNCTION public.set_invite_code();

-- Create function to reset virtual joins monthly
CREATE OR REPLACE FUNCTION public.reset_virtual_joins_if_needed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we're in a new month
  IF NEW.virtual_joins_reset_date < date_trunc('month', CURRENT_DATE) THEN
    NEW.virtual_joins_this_month := 0;
    NEW.virtual_joins_reset_date := date_trunc('month', CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_virtual_joins_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.reset_virtual_joins_if_needed();

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_cowork_sessions_host_id ON public.cowork_sessions(host_id);
CREATE INDEX idx_cowork_sessions_start_time ON public.cowork_sessions(start_time);
CREATE INDEX idx_cowork_sessions_is_private ON public.cowork_sessions(is_private);
CREATE INDEX idx_session_members_session_id ON public.session_members(session_id);
CREATE INDEX idx_session_members_user_id ON public.session_members(user_id);
CREATE INDEX idx_sprints_session_id ON public.sprints(session_id);
CREATE INDEX idx_sprint_participations_sprint_id ON public.sprint_participations(sprint_id);
CREATE INDEX idx_sprint_participations_user_id ON public.sprint_participations(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_venues_google_place_id ON public.venues(google_place_id);