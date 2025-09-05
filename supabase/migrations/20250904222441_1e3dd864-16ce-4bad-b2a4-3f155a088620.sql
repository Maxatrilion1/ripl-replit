-- Update the handle_new_user trigger to better handle user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_title TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract name from various possible sources
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name', 
    NEW.email,
    'User'
  );
  
  -- Extract title/headline
  user_title := COALESCE(
    NEW.raw_user_meta_data->>'headline',
    NEW.raw_user_meta_data->>'title'
  );
  
  -- Extract avatar URL
  user_avatar := NEW.raw_user_meta_data->>'picture';

  INSERT INTO public.profiles (
    user_id, 
    name, 
    title, 
    avatar_url,
    is_anonymous
  )
  VALUES (
    NEW.id, 
    user_name,
    CASE WHEN user_title IS NOT NULL THEN substring(user_title from 1 for 50) ELSE NULL END,
    user_avatar,
    COALESCE((NEW.raw_user_meta_data->>'is_anonymous')::boolean, false)
  );
  
  RETURN NEW;
END;
$$;