-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Oracle 2.0: Causal Intelligence & Vault
-- High-complexity intelligence infrastructure (S.P.V, C.A, Vault)
-- ═══════════════════════════════════════════════════════════

-- 1. THE INTELLIGENCE VAULT (Persistent Vector Storage)
CREATE TABLE IF NOT EXISTS public.intelligence_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name TEXT NOT NULL,       -- e.g. "Laxmikanth", "UPSC PYQ 2024", "NCERT History"
    content TEXT NOT NULL,           -- Chunks of data
    embedding VECTOR(768),           -- Gemini text-embedding-004
    metadata JSONB,                  -- { "chapter": "Judiciary", "page": 44, "year": 2024 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_embedding ON public.intelligence_vault USING hnsw (embedding vector_cosine_ops);

-- 2. CALIBRATION UPGRADE (Causal Auditing)
ALTER TABLE public.oracle_calibrations
    ADD COLUMN IF NOT EXISTS causal_audit JSONB DEFAULT '{}'::jsonb; -- { "q1_trigger": "Constitutional Amendment anniversary" }

-- 3. LETHALITY 2.0 SCHEMA (Mathematical Scoring)
ALTER TABLE public.cards
    -- Dynamic Lethality Variables
    ADD COLUMN IF NOT EXISTS static_pillar_value NUMERIC DEFAULT 0,  -- S.P.V (Syllabus weight)
    ADD COLUMN IF NOT EXISTS causal_anchor NUMERIC DEFAULT 0,        -- C.A (Trigger score)
    ADD COLUMN IF NOT EXISTS option_evolution NUMERIC DEFAULT 0,     -- O.E (Complexity shift)
    ADD COLUMN IF NOT EXISTS cross_exam_signals NUMERIC DEFAULT 0,   -- X.S (CDS/NDA data)
    ADD COLUMN IF NOT EXISTS grey_area_complexity NUMERIC DEFAULT 0, -- G.C (Ambiguity index)
    
    -- Transparent Logic Strings
    ADD COLUMN IF NOT EXISTS trigger_dna TEXT,                       -- Why this exists?
    ADD COLUMN IF NOT EXISTS evolution_path TEXT;                    -- History of topic

-- 4. VECTOR VAULT MATCHING FUNCTION
CREATE OR REPLACE FUNCTION match_vault_content (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  source_name text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    source_name,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from public.intelligence_vault
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by (embedding <=> query_embedding) desc -- Correction: should be DESC for similarity
  limit match_count;
$$;
