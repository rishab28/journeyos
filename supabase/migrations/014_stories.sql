-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Stories Engine Migration
-- Ephemeral content (24h) for Current Affairs validation
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content jsonb NOT NULL, -- Array of slide strings/objects
  mcq_id uuid REFERENCES cards(id) ON DELETE SET NULL, -- Tie back to a validating card
  expires_at timestamptz NOT NULL, -- Automatically filtered out after 24 hours
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for finding active stories quickly
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories (expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_subject ON stories (subject);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read active stories" ON stories;
CREATE POLICY "Public read active stories" ON stories
  FOR SELECT USING (expires_at > now());

-- Authenticated admins can insert
DROP POLICY IF EXISTS "Authenticated insert stories" ON stories;
CREATE POLICY "Authenticated insert stories" ON stories
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass" ON stories;
CREATE POLICY "Service role bypass" ON stories
  USING (true) WITH CHECK (true);
