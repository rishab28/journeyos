-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Migration 003: Rank 1 Factory Updates
-- Eliminator Tricks, Burnout State Trackers
-- ═══════════════════════════════════════════════════════════

-- 1. Add elimination_trick to the cards table
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS elimination_trick text;

-- (Optional but recommended) Index to speed up any future analytics on specific card features
CREATE INDEX IF NOT EXISTS idx_cards_elimination_trick ON cards(elimination_trick) WHERE elimination_trick IS NOT NULL;

-- Note: 'priority_score' and 'topper_trick' were already added in the previous manual step.
-- Note: 'cross_refs' was already added in 002.
