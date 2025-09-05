-- Fix recursive RLS policy causing infinite recursion on session_members
DROP POLICY IF EXISTS "Users can view memberships for sessions they can see" ON public.session_members;

CREATE POLICY "Users can view memberships for accessible sessions"
ON public.session_members
FOR SELECT
USING (
  -- Users can always view their own membership rows
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.cowork_sessions cs
    WHERE cs.id = session_members.session_id
      AND (
        cs.is_private = false
        OR cs.host_id = auth.uid()
      )
  )
);

-- Ensure invite_code is automatically set for cowork_sessions inserts
DROP TRIGGER IF EXISTS set_invite_code_before_insert ON public.cowork_sessions;

CREATE TRIGGER set_invite_code_before_insert
BEFORE INSERT ON public.cowork_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_invite_code();