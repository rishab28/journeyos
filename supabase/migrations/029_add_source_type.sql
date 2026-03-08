-- ═══════════════════════════════════════════════════════════
-- Migration 029: Add source_type to source_metadata
-- Enables context-aware processing per file type
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.source_metadata
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'TEXTBOOK';

-- Add a comment for documentation
COMMENT ON COLUMN public.source_metadata.source_type IS 
  'File classification: TEXTBOOK, PYQ_PAPER, NOTIFICATION, NEWS, NOTES, CURRENT_AFFAIRS';
