-- 045_evolutionary_oracle.sql

CREATE TABLE IF NOT EXISTS public.oracle_chronologies (
    year INTEGER PRIMARY KEY,
    actual_themes JSONB DEFAULT '[]'::jsonb,
    predicted_themes JSONB DEFAULT '[]'::jsonb,
    surviving_topics JSONB DEFAULT '[]'::jsonb,
    pruned_topics JSONB DEFAULT '[]'::jsonb,
    accuracy_score NUMERIC(5,2) DEFAULT 0.0,
    current_affairs_triggers JSONB DEFAULT '[]'::jsonb,
    logic_weights JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.oracle_chronologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON public.oracle_chronologies
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for service role" ON public.oracle_chronologies
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_oracle_chronologies_year 
    ON public.oracle_chronologies(year DESC);

-- Also add a table for raw ingested paper data segmented by year
CREATE TABLE IF NOT EXISTS public.oracle_raw_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, subject)
);

ALTER TABLE public.oracle_raw_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON public.oracle_raw_papers
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for service role" ON public.oracle_raw_papers
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_oracle_raw_papers_year 
    ON public.oracle_raw_papers(year DESC);

NOTIFY pgrst, 'reload schema';
