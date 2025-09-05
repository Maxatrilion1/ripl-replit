-- Ensure max_participants default is 50 (already set, but confirming)
-- Check if trigger exists for invite codes, if not create it

-- Create trigger for auto-generating invite codes on session creation
CREATE OR REPLACE TRIGGER trigger_set_invite_code
    BEFORE INSERT ON public.cowork_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invite_code();