-- Migration: Oracle Audit Engine Columns
-- Purpose: Adds verifiable transparency (Hits/Misses/Insights) to the chronological predictions

ALTER TABLE public.oracle_chronologies
ADD COLUMN IF NOT EXISTS direct_hits JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS misses JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS surprise_topics JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_insight TEXT;

-- Update existing records to have empty arrays instead of null gracefully
UPDATE public.oracle_chronologies SET direct_hits = '{}' WHERE direct_hits IS NULL;
UPDATE public.oracle_chronologies SET misses = '{}' WHERE misses IS NULL;
UPDATE public.oracle_chronologies SET surprise_topics = '{}' WHERE surprise_topics IS NULL;
