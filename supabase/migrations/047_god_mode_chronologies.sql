-- 047_god_mode_chronologies.sql

-- Add advanced tracking columns to store the MoE Debate and Penalty insights
ALTER TABLE public.oracle_chronologies
ADD COLUMN IF NOT EXISTS causal_insights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trajectory_shifts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS negative_space_pressure JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS moe_debate_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pendulum_state JSONB DEFAULT '{"factual_bias": 0.5, "conceptual_bias": 0.5}'::jsonb;

-- Update the schema cache so Supabase can see the new columns immediately
NOTIFY pgrst, 'reload schema';
