-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Admin Content Engine RLS Fix
-- Grants full access to 'cards' table for authenticated users
-- ═══════════════════════════════════════════════════════════

-- Cards: Ensure Authenticated users can do EVERYTHING (Insert, Update, Delete)
DROP POLICY IF EXISTS "Authenticated full access cards" ON cards;
CREATE POLICY "Authenticated full access cards" ON cards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cards: Ensure Anon users can at least insert drafts (if testing without login)
DROP POLICY IF EXISTS "Anon insert drafts" ON cards;
CREATE POLICY "Anon insert drafts" ON cards
  FOR INSERT TO anon WITH CHECK (true);
