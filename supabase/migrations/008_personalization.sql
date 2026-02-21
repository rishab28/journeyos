-- Phase 16: Personalization Engine (Brain-Extension)
-- Adds scaffolding and analogies to cards.

ALTER TABLE cards ADD COLUMN IF NOT EXISTS scaffold_level text DEFAULT 'Foundation';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS custom_analogy text;
