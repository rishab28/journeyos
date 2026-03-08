-- 034_mentor_tags.sql
-- Add subject and topic tagging to mentor conversations

ALTER TABLE public.mentor_conversations
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS topic text;
