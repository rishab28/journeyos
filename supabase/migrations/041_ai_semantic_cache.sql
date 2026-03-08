-- ═══════════════════════════════════════════════════════════
-- JourneyOS Migration: 041_ai_semantic_cache
-- Purpose: Reduce LLM costs and quota usage via semantic reuse
-- ═══════════════════════════════════════════════════════════

-- Enable vector extension if not already present
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ai_semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT UNIQUE NOT NULL, -- MD5/SHA of the prompt for exact matches
    query_text TEXT NOT NULL,
    response_body JSONB NOT NULL,
    embedding VECTOR(768), -- Matching Gemini text-embedding-004
    model_used TEXT NOT NULL,
    tokens_used INTEGER,
    metadata JSONB, -- For subject, topic, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for exact hash matches (fastest)
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON public.ai_semantic_cache(query_hash);

-- HNSW Index for semantic similarity search
CREATE INDEX IF NOT EXISTS idx_ai_cache_embedding ON public.ai_semantic_cache USING hnsw (embedding vector_cosine_ops);

-- Enable RLS (Service role only typically, but engines need access)
ALTER TABLE public.ai_semantic_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (engines) to read/write cache
CREATE POLICY "Enable read/write for authenticated users" ON public.ai_semantic_cache
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to search semantic cache
CREATE OR REPLACE FUNCTION match_ai_cache (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  query_text TEXT,
  response_body JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    query_text,
    response_body,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.ai_semantic_cache
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY (embedding <=> query_embedding) ASC
  LIMIT match_count;
$$;
