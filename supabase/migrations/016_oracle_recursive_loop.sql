-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Oracle Sniper Engine (Recursive Backtesting Upgrades)
-- Tracks the multi-set prediction accuracy & misses (2008-2025)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.oracle_calibrations
    -- Store an array of 5 independent prediction runs for rigorous validation
    ADD COLUMN IF NOT EXISTS prediction_sets JSONB DEFAULT '[]'::jsonb, 
    
    -- Track the overall accuracy curve (0 to 100)
    ADD COLUMN IF NOT EXISTS match_percentage NUMERIC DEFAULT 0,
    
    -- Track exactly what the AI *missed* in its predictions to force evolution
    ADD COLUMN IF NOT EXISTS unpredicted_topics JSONB DEFAULT '[]'::jsonb,
    
    -- Explains structural changes (e.g. "Elimination format removed")
    ADD COLUMN IF NOT EXISTS pattern_shift TEXT;
