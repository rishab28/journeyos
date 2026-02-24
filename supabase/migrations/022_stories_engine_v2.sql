-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Stories Engine V2
-- High-frequency (4h) curated news for UPSC
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL, -- Subject enum equivalent (Polity, Economy, etc.)
  title text NOT NULL,
  summary jsonb NOT NULL, -- Array of 2 bullet points
  source_url text,
  metadata jsonb, -- For storing raw feed data or AI reasoning
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_stories_expires_at ON daily_stories (expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_stories_subject ON daily_stories (subject);
CREATE INDEX IF NOT EXISTS idx_daily_stories_created_at ON daily_stories (created_at);

-- Enable RLS
ALTER TABLE daily_stories ENABLE ROW LEVEL SECURITY;

-- Public read for active stories
DROP POLICY IF EXISTS "Public read daily stories" ON daily_stories;
CREATE POLICY "Public read daily stories" ON daily_stories
  FOR SELECT USING (expires_at > now());

-- Authenticated/Service Role can manage
DROP POLICY IF EXISTS "Service role manage daily stories" ON daily_stories;
CREATE POLICY "Service role manage daily stories" ON daily_stories
  FOR ALL TO service_role USING (true) WITH CHECK (true);
