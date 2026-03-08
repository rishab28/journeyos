-- ═══════════════════════════════════════════════════════════
-- JourneyOS Migration: 042_intelligence_telemetry
-- Purpose: Detailed tracking of AI usage, costs, and saved quota
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    model TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost_estimate NUMERIC(10, 6) DEFAULT 0, -- Estimated USD cost
    source_action TEXT, -- e.g., 'EXTRACTION', 'MENTOR_CHAT', 'ANALOGY'
    metadata JSONB, -- For subject, topic, latency, etc.
    is_cached BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for monitoring high-cost users/actions
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_action ON public.ai_usage_logs(source_action);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Service role can read/write everything. 
-- Authenticated users (engines) can insert their own logs.
CREATE POLICY "Enable insert for authenticated users" ON public.ai_usage_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Admins can view all usage logs
CREATE POLICY "Admins can view all AI logs" ON public.ai_usage_logs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Helper function to estimate cost (rough pricing for 2025)
CREATE OR REPLACE FUNCTION estimate_ai_cost(model_name TEXT, tin INTEGER, tout INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    cost NUMERIC := 0;
BEGIN
    -- Roughly $ per million tokens
    IF model_name ILIKE '%gemini-2.0-flash%' THEN
        cost := (tin * 0.1 / 1000000) + (tout * 0.4 / 1000000);
    ELSIF model_name ILIKE '%claude-3-7-sonnet%' THEN
        cost := (tin * 3.0 / 1000000) + (tout * 15.0 / 1000000);
    ELSIF model_name ILIKE '%gemini-2.0-pro%' THEN
        cost := (tin * 1.25 / 1000000) + (tout * 5.0 / 1000000);
    END IF;
    RETURN cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
