-- Step 2: Add pause/resume functionality to sprints

-- Add columns for pause tracking
ALTER TABLE public.sprints 
ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_paused_ms integer NOT NULL DEFAULT 0;