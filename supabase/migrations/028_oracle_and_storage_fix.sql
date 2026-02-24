-- ═══════════════════════════════════════════════════════════
-- Migration 028: Oracle Tables + Storage Bucket Fix
-- Fixes missing oracle_calibrations, system_iq_evolution,
-- and creates the 'pdfs' storage bucket.
-- ═══════════════════════════════════════════════════════════

-- 1. Create oracle_calibrations table (needed by Oracle Admin Terminal)
CREATE TABLE IF NOT EXISTS public.oracle_calibrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    predicted_themes TEXT[] DEFAULT '{}',
    learned_logic_weights JSONB DEFAULT '{}',
    pattern_yield INTEGER DEFAULT 0,
    system_iq NUMERIC(5,2) DEFAULT 50.0,
    match_percentage NUMERIC(5,2) DEFAULT 0.0,
    unpredicted_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for oracle_calibrations
ALTER TABLE public.oracle_calibrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON public.oracle_calibrations
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for service role" ON public.oracle_calibrations
    FOR ALL USING (true);

-- 2. Create system_iq_evolution table (needed by Oracle DNA chart)
CREATE TABLE IF NOT EXISTS public.system_iq_evolution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    iq_score NUMERIC(5,2) DEFAULT 50.0,
    cycle_type TEXT DEFAULT 'single',
    year_processed INTEGER,
    notes TEXT
);

ALTER TABLE public.system_iq_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON public.system_iq_evolution
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for service role" ON public.system_iq_evolution
    FOR ALL USING (true);

-- 3. Ensure source_metadata table has all required columns
CREATE TABLE IF NOT EXISTS public.source_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    display_name TEXT,
    domain TEXT DEFAULT 'GS',
    subject TEXT DEFAULT '',
    folder_name TEXT DEFAULT 'Uncategorized',
    is_processed BOOLEAN DEFAULT FALSE,
    card_yield INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.source_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for source_metadata" ON public.source_metadata
    FOR ALL USING (true);

-- 4. Create 'pdfs' storage bucket (run via Supabase Dashboard or service role)
-- NOTE: Storage buckets cannot be created via SQL migrations.
-- You MUST create it manually via the Supabase Dashboard:
--   Dashboard → Storage → New Bucket → Name: "pdfs" → Public: false
-- OR via the Supabase Management API with service_role key.

-- 5. Index for faster oracle queries
CREATE INDEX IF NOT EXISTS idx_oracle_calibrations_year 
    ON public.oracle_calibrations(year DESC);

CREATE INDEX IF NOT EXISTS idx_system_iq_evolution_timestamp
    ON public.system_iq_evolution(timestamp DESC);
