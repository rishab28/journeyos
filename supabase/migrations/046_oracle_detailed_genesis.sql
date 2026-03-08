-- 046_oracle_detailed_genesis.sql

-- Add a new column to store the deeply extracted structured JSON questions per year/subject
ALTER TABLE public.oracle_raw_papers
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;

-- Update the schema cache so Supabase can see the new column immediately
NOTIFY pgrst, 'reload schema';
