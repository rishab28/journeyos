-- Add missing columns for Gemini 2.5 Flash upgrades
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS topic_map TEXT,
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Update the schema cache so Supabase can see the new columns immediately
NOTIFY pgrst, 'reload schema';
