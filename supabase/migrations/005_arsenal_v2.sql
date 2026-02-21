-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Migration 005: Arsenal V2 Attributes
-- Circadian Rhythms, Dynamic Distractors, Semantic Searching
-- ═══════════════════════════════════════════════════════════

-- 1. Updates to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS peak_focus_start time,
ADD COLUMN IF NOT EXISTS peak_focus_end time,
ADD COLUMN IF NOT EXISTS voice_recognition_accuracy float DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS failed_mcq_options text[] DEFAULT '{}';

-- 2. Updates to cards table
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS logic_derivation text,
ADD COLUMN IF NOT EXISTS interlink_ids uuid[] DEFAULT '{}';
