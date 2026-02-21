-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add an embedding column to the cards table
-- Note: Gemini's text-embedding-004 model generates 768-dimensional embeddings by default.
-- Using 768 dimensions instead of 1536 to ensure compatibility with Gemini outputs.
alter table public.cards add column if not exists embedding vector(768);

-- Create an HNSW index for faster similarity search (Recommended for scale)
create index if not exists cards_embedding_idx on public.cards using hnsw (embedding vector_cosine_ops);

-- Create a function to search for cards using cosine similarity
create or replace function match_cards (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  front text,
  back text,
  explanation text,
  custom_analogy text,
  subject text,
  topic text,
  similarity float
)
language sql stable
as $$
  select
    id,
    front,
    back,
    explanation,
    custom_analogy,
    subject,
    topic,
    1 - (embedding <=> query_embedding) as similarity
  from public.cards
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by (embedding <=> query_embedding) asc
  limit match_count;
$$;
