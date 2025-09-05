-- Fix the cowork_sessions RLS policy causing infinite recursion
DROP POLICY IF EXISTS "Anyone can view public sessions" ON public.cowork_sessions;

CREATE POLICY "Anyone can view public sessions"
ON public.cowork_sessions
FOR SELECT
USING (
  is_private = false
  OR host_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.session_members sm
    WHERE sm.session_id = cowork_sessions.id
      AND sm.user_id = auth.uid()
  )
);