-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Phase 42: Syllabus Intelligence Schema
-- Hierarchical Blueprint for Exam Logic Mapping
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.syllabus_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_type TEXT NOT NULL,         -- 'UPSC', 'HAS', etc.
    paper_name TEXT NOT NULL,        -- 'GS1', 'GS2', 'Ethics', etc.
    node_name TEXT NOT NULL,         -- 'Federalism', 'Biodiversity'
    description TEXT,
    parent_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
    embedding VECTOR(768),           -- Used for RAG discovery
    level INTEGER DEFAULT 1,         -- 1=Subject, 2=Major Topic, 3=Subtopic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector search on syllabus concepts
CREATE INDEX IF NOT EXISTS idx_syllabus_node_embedding ON public.syllabus_nodes USING hnsw (embedding vector_cosine_ops);

-- Evolution IQ Tracker (Intelligence DNA)
CREATE TABLE IF NOT EXISTS public.system_iq_evolution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pattern_accuracy NUMERIC NOT NULL,
    causal_density NUMERIC NOT NULL,     -- How many connections per node?
    node_coverage NUMERIC NOT NULL,      -- % of syllabus nodes mapped to PYQs
    reasoning_shift TEXT,                -- AI's own summary of its evolution
    evolved_logic_snapshot JSONB         -- Snapshot of weights at that time
);

-- Update oracle_calibrations to link to syllabus coverage
ALTER TABLE public.oracle_calibrations 
    ADD COLUMN IF NOT EXISTS syllabus_coverage JSONB DEFAULT '[]'::jsonb; -- Array of {node_id, match_count}
