-- Completely remove and recreate all RLS policies for cowork_sessions to eliminate recursion
DROP POLICY IF EXISTS "Anyone can view public sessions" ON public.cowork_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.cowork_sessions;
DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.cowork_sessions;
DROP POLICY IF EXISTS "Hosts can delete their sessions" ON public.cowork_sessions;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for public sessions"
ON public.cowork_sessions
FOR SELECT
USING (
  is_private = false 
  OR host_id = auth.uid()
);

CREATE POLICY "Enable insert for authenticated users"
ON public.cowork_sessions
FOR INSERT
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Enable update for session hosts"
ON public.cowork_sessions
FOR UPDATE
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Enable delete for session hosts"
ON public.cowork_sessions
FOR DELETE
USING (auth.uid() = host_id);