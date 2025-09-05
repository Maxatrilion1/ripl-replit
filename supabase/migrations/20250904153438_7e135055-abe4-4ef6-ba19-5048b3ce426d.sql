-- Update default max_participants to 50
ALTER TABLE public.cowork_sessions 
ALTER COLUMN max_participants SET DEFAULT 50;

-- Create invite code trigger if not exists
CREATE OR REPLACE FUNCTION public.set_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for invite codes on cowork_sessions
DROP TRIGGER IF EXISTS set_invite_code_trigger ON public.cowork_sessions;
CREATE TRIGGER set_invite_code_trigger
  BEFORE INSERT ON public.cowork_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invite_code();

-- Remove virtual joins reset trigger
DROP TRIGGER IF EXISTS reset_virtual_joins_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.reset_virtual_joins_if_needed();

-- Keep virtual_joins_this_month and virtual_joins_reset_date columns but remove auto-reset functionality