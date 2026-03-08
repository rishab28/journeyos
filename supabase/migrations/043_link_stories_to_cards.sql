-- 043_link_stories_to_cards.sql
-- Adds card_id to daily_stories to allow pre-generated content linking
ALTER TABLE daily_stories ADD COLUMN IF NOT EXISTS card_id uuid REFERENCES cards(id) ON DELETE SET NULL;

-- Index for faster joins
CREATE INDEX IF NOT EXISTS idx_daily_stories_card_id ON daily_stories (card_id);
