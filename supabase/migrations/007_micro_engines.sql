-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Migration 007: The Micro-Engines
-- Adding precision tracking for Failure Audit, Certainty, and Stress
-- ═══════════════════════════════════════════════════════════

-- 1. Add new tracking columns to review_history
ALTER TABLE review_history ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE review_history ADD COLUMN IF NOT EXISTS certainty_score integer; -- 1 to 5 scale
ALTER TABLE review_history ADD COLUMN IF NOT EXISTS time_to_answer_ms integer;

-- 2. Add composite indices to allow rapid dashboard querying of failure reasons
CREATE INDEX IF NOT EXISTS idx_reviews_failure ON review_history(failure_reason) WHERE failure_reason IS NOT NULL;
