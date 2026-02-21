-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Consolidated Migration (Phases 5-7)
-- Adds all new columns + profiles table
-- ═══════════════════════════════════════════════════════════

-- 1. Add new columns to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS mains_point text;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS syllabus_topic text;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS cross_refs text[];

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_cards_syllabus ON cards (syllabus_topic);
CREATE INDEX IF NOT EXISTS idx_cards_cross_refs ON cards USING GIN (cross_refs);

-- 3. Profiles table with AI credits
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  display_name text,
  ai_credits integer NOT NULL DEFAULT 5,
  last_credit_reset timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles (user_id);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to profiles'
  ) THEN
    CREATE POLICY "Allow all access to profiles"
      ON profiles FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
