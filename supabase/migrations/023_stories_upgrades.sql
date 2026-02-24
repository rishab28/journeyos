-- 023_stories_upgrades.sql
ALTER TABLE daily_stories ADD COLUMN IF NOT EXISTS syllabus_topic text;
ALTER TABLE daily_stories ADD COLUMN IF NOT EXISTS mains_fodder text;

-- Index for syllabus search
CREATE INDEX IF NOT EXISTS idx_daily_stories_syllabus ON daily_stories (syllabus_topic);
