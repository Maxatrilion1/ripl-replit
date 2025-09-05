-- Update profiles table structure
-- Rename display_name to name for consistency
ALTER TABLE public.profiles RENAME COLUMN display_name TO name;

-- Ensure title column exists (it should already exist)
-- Add NOT NULL constraint with default value for existing records
UPDATE public.profiles SET name = COALESCE(name, 'User') WHERE name IS NULL;
ALTER TABLE public.profiles ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN name SET DEFAULT 'User';

-- Update the handle_new_user function to use 'name' instead of 'display_name'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, title, is_anonymous)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'headline', NEW.raw_user_meta_data->>'title'),
    COALESCE((NEW.raw_user_meta_data->>'is_anonymous')::boolean, false)
  );
  RETURN NEW;
END;
$$;