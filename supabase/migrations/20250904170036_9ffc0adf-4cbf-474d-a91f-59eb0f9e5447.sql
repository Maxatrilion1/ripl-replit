-- Step 1: Enable realtime safely and add helpful indexes

-- Ensure full row data is available for updates
ALTER TABLE public.session_members REPLICA IDENTITY FULL;
ALTER TABLE public.sprints REPLICA IDENTITY FULL;
ALTER TABLE public.sprint_participations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add useful indexes to improve subscription/query performance
CREATE INDEX IF NOT EXISTS session_members_session_id_idx ON public.session_members(session_id);
CREATE INDEX IF NOT EXISTS sprints_session_id_idx ON public.sprints(session_id);
CREATE INDEX IF NOT EXISTS sprint_participations_sprint_id_idx ON public.sprint_participations(sprint_id);

-- Add tables to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'session_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_members;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sprints'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sprint_participations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sprint_participations;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;