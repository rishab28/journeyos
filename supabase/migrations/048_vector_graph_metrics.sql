-- 048_vector_graph_metrics.sql

-- Add advanced tracking columns to store Vector Syllabus Graph metrics
ALTER TABLE public.oracle_chronologies
ADD COLUMN IF NOT EXISTS topological_distances JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS graph_edges_traversed JSONB DEFAULT '[]'::jsonb;

-- Update the schema cache so Supabase can see the new columns immediately
NOTIFY pgrst, 'reload schema';
