-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Oracle Sniper Engine (Backtesting)
-- Tracks the 15-year recursive AI backtesting loop (2010-2025)
-- ═══════════════════════════════════════════════════════════

-- 1. Create the `oracle_calibrations` table
CREATE TABLE IF NOT EXISTS public.oracle_calibrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE, -- e.g., 2010
    predicted_themes JSONB,       -- What the engine predicted for this year (based on Prior Year)
    actual_themes JSONB NOT NULL, -- What actually came in this year's paper
    deviation_analysis TEXT,      -- The AI's self-reflection: "Why was my prediction wrong?"
    learned_logic_weights JSONB,  -- How the AI adjusted its internal weighting (e.g. { "fact": 0.2, "logic": 0.8 })
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.oracle_calibrations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to calibrations
CREATE POLICY "Allow public read access to oracle calibrations"
ON public.oracle_calibrations FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users (Admins) to insert/update calibrations
CREATE POLICY "Allow authenticated to insert oracle calibrations"
ON public.oracle_calibrations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated to update oracle calibrations"
ON public.oracle_calibrations FOR UPDATE
TO authenticated
USING (true);

-- 2. Modify the `cards` table to add Transparent Insights (Oracle Output)
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS trend_evolution TEXT,
ADD COLUMN IF NOT EXISTS oracle_confidence INTEGER, -- e.g., 85 (%)
ADD COLUMN IF NOT EXISTS format_prediction TEXT;    -- e.g., "Statement Analysis"

-- 3. Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oracle_calibrations_year ON public.oracle_calibrations(year);
CREATE INDEX IF NOT EXISTS idx_cards_oracle_confidence ON public.cards(oracle_confidence);
