-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Vault 2.0: The Deepening (Migration)
-- Establishing the Causal Graph & Saturation Layers
-- ═══════════════════════════════════════════════════════════

-- 1. INTELLIGENCE CONNECTIONS (The Causal Graph)
CREATE TABLE IF NOT EXISTS public.intelligence_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL,          -- Intelligence item A
    target_id UUID NOT NULL,          -- Intelligence item B
    connection_type TEXT NOT NULL,    -- 'causal', 'contextual', 'contradictory', 'evolutionary'
    strength NUMERIC DEFAULT 1.0,     -- 0.0 to 1.0
    logic_explanation TEXT,           -- Why are these linked?
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for graph traversal
CREATE INDEX IF NOT EXISTS idx_intel_connections_source ON public.intelligence_connections(source_id);
CREATE INDEX IF NOT EXISTS idx_intel_connections_target ON public.intelligence_connections(target_id);

-- 2. SYLLABUS SATURATION TRACKING
ALTER TABLE public.intelligence_vault 
    ADD COLUMN IF NOT EXISTS saturation_weight NUMERIC DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- 3. HELPER: FETCH CAUSAL GRAPH
CREATE OR REPLACE FUNCTION get_intel_connections(start_id UUID)
RETURNS TABLE (
    connection_id UUID,
    linked_id UUID,
    type TEXT,
    strength NUMERIC,
    logic TEXT,
    direction TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT id, target_id, connection_type, strength, logic_explanation, 'forward'
    FROM intelligence_connections WHERE source_id = start_id
    UNION ALL
    SELECT id, source_id, connection_type, strength, logic_explanation, 'backward'
    FROM intelligence_connections WHERE target_id = start_id;
END;
$$;
