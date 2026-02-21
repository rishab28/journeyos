-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Migration 006: Resilience & Indexing
-- Adding B-Tree Indexes to prevent slow queries at 100k+ scale
-- ═══════════════════════════════════════════════════════════

-- 1. Index for fetching cards by User ID (for stats & dashboard)
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- 2. Indexes for Feed Generation filtering
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_subject ON cards(subject);
CREATE INDEX IF NOT EXISTS idx_cards_topic ON cards(topic);

-- 3. Composite Index for the "Live Feed Fetch" Query
-- This speeds up querying for live flashcards that are ready for a specific subject
CREATE INDEX IF NOT EXISTS idx_cards_status_subject ON cards(status, subject);

-- 4. Index on reviews for faster analytics generation
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON review_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON review_history(card_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON review_history(created_at);
