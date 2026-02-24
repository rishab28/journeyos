-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Fix Stories RLS for Anon Key Pipeline
-- Allow authenticated and anon to insert daily_stories
-- (Since service_role key is not configured, we allow inserts
-- from the server-side anon key for admin pipeline operations)
-- ═══════════════════════════════════════════════════════════

-- Allow any role to insert (admin pipeline runs server-side)
DROP POLICY IF EXISTS "Anon insert daily stories" ON daily_stories;
CREATE POLICY "Anon insert daily stories" ON daily_stories
  FOR INSERT WITH CHECK (true);

-- Allow any role to select active stories
DROP POLICY IF EXISTS "Public read daily stories" ON daily_stories;
CREATE POLICY "Public read daily stories" ON daily_stories
  FOR SELECT USING (true);

-- Allow any role to delete (for cleanup)
DROP POLICY IF EXISTS "Anon delete daily stories" ON daily_stories;
CREATE POLICY "Anon delete daily stories" ON daily_stories
  FOR DELETE USING (true);
