-- ═══════════════════════════════════════════════════════════
-- JourneyOS Migration: 025_system_configs
-- Global Key-Value store for Admin tactical overrides
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage system_configs" ON public.system_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Read access for all authenticated (so engines can read global settings)
CREATE POLICY "Authenticated users can read system_configs" ON public.system_configs
    FOR SELECT TO authenticated USING (true);

-- Initial default configs
INSERT INTO public.system_configs (key, value) VALUES
('ai_gateway', '{"provider": "gemini", "model": "gemini-1.5-pro", "temperature": 0.7}'),
('srs_calibration', '{"base_ease": 2.5, "min_ease": 1.3, "interval_modifier": 1.0}'),
('prompt_version', '{"extraction_v": "2.1", "analogy_v": "1.8"}')
ON CONFLICT (key) DO NOTHING;
