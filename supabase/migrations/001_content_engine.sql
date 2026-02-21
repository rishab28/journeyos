-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Content Engine Migration (Full Setup)
-- Creates cards + suggestions tables from scratch
-- Safe to re-run (fully idempotent)
-- ═══════════════════════════════════════════════════════════


-- ─── 1. Cards table (base + content engine fields) ──────────

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,

  -- Classification
  type text NOT NULL DEFAULT 'FLASHCARD',
  domain text NOT NULL DEFAULT 'GS',
  subject text NOT NULL,
  topic text NOT NULL,
  sub_topic text,
  difficulty text NOT NULL DEFAULT 'MEDIUM',
  exam_tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',

  -- Content
  front text NOT NULL,
  back text NOT NULL,
  options jsonb,
  year integer,
  exam_name text,
  source_pdf text,

  -- SRS metadata
  ease_factor numeric NOT NULL DEFAULT 2.5,
  interval integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  next_review_date timestamptz NOT NULL DEFAULT now(),
  last_review_date timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ─── 2. Indexes for fast queries ────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cards_status ON cards (status);
CREATE INDEX IF NOT EXISTS idx_cards_domain ON cards (domain);
CREATE INDEX IF NOT EXISTS idx_cards_subject ON cards (subject);
CREATE INDEX IF NOT EXISTS idx_cards_exam_tags ON cards USING GIN (exam_tags);
CREATE INDEX IF NOT EXISTS idx_cards_status_domain ON cards (status, domain);
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards (next_review_date);


-- ─── 3. Suggestions table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid,

  -- Original content snapshot
  original_front text NOT NULL,
  original_back text NOT NULL,

  -- User's suggested changes
  suggested_front text NOT NULL,
  suggested_back text NOT NULL,

  -- AI validation
  ai_validation_status text NOT NULL DEFAULT 'pending',
  ai_response jsonb,
  is_applied boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_card ON suggestions (card_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions (ai_validation_status);
CREATE INDEX IF NOT EXISTS idx_suggestions_not_applied ON suggestions (is_applied) WHERE is_applied = false;


-- ─── 4. Enable RLS ──────────────────────────────────────────

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;


-- ─── 5. RLS Policies (DROP + CREATE = safe re-run) ──────────

-- Cards: Anyone can read live cards
DROP POLICY IF EXISTS "Public read live cards" ON cards;
CREATE POLICY "Public read live cards" ON cards
  FOR SELECT USING (status = 'live');

-- Cards: Anyone can insert drafts (needed for local ingestor)
DROP POLICY IF EXISTS "Public insert cards" ON cards;
CREATE POLICY "Public insert cards" ON cards
  FOR INSERT WITH CHECK (true);

-- Cards: Authenticated users can update (admin/review)
DROP POLICY IF EXISTS "Authenticated update cards" ON cards;
CREATE POLICY "Authenticated update cards" ON cards
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Suggestions: Anyone can insert (crowdsourced)
DROP POLICY IF EXISTS "Anyone can suggest" ON suggestions;
CREATE POLICY "Anyone can suggest" ON suggestions
  FOR INSERT WITH CHECK (true);

-- Suggestions: Authenticated users can read all
DROP POLICY IF EXISTS "Read suggestions" ON suggestions;
CREATE POLICY "Read suggestions" ON suggestions
  FOR SELECT TO authenticated USING (true);

-- Suggestions: Authenticated users can update (admin apply)
DROP POLICY IF EXISTS "Update suggestions" ON suggestions;
CREATE POLICY "Update suggestions" ON suggestions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ─── 6. Updated_at auto-trigger ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cards
DROP TRIGGER IF EXISTS cards_updated_at ON cards;
CREATE TRIGGER cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for suggestions
DROP TRIGGER IF EXISTS suggestions_updated_at ON suggestions;
CREATE TRIGGER suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
