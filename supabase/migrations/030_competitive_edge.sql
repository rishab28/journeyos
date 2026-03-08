-- 030_competitive_edge.sql
-- Add Mind Map and Translation support to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS topic_map text;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb;

-- Add Source Information to stories for Newspaper feel
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_info jsonb DEFAULT '{"name": "General", "logo_url": ""}'::jsonb;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS editorial_style boolean DEFAULT false;

-- Index for translation searches if needed
CREATE INDEX IF NOT EXISTS idx_cards_topic_map ON cards(topic_map) WHERE topic_map IS NOT NULL;
