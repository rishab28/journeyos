-- 049_shadow_matrix_metrics.sql

-- Add columns to support the ultimate Oracle V3 predictions and learning logic
ALTER TABLE public.oracle_chronologies
ADD COLUMN IF NOT EXISTS shadow_matrix JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS hype_backfire_logs JSONB DEFAULT '[]'::jsonb;

-- Update the schema cache so Supabase can see the new columns immediately
NOTIFY pgrst, 'reload schema';
