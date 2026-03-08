-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Migration 036: Automatic Stories Sync
-- Schedules a 4-hour heartbeat to trigger RSS → AI → DB pipeline
-- ═══════════════════════════════════════════════════════════

-- Ensure pg_cron and pg_net extensions exist (Supported on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a helper function to trigger the sync via HTTP
-- This hits the local/production API endpoint
CREATE OR REPLACE FUNCTION trigger_stories_sync()
RETURNS void AS $$
BEGIN
  -- We use pg_net's http_get to trigger the Next.js API route
  -- Note: The URL is constructed dynamically or targeted at the internal service
  -- For Vercel deployments, replace this with your production URL 
  -- For local dev, this would typically be your local tunnel or internal Docker IP
  PERFORM net.http_get(
    url := (SELECT value FROM public.system_configs WHERE key = 'app_url') || '/api/cron/stories',
    headers := '{"Content-Type": "application/json"}'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run every 4 hours
-- '0 */4 * * *' = Minute 0 of every 4th hour
SELECT cron.schedule(
    'auto-sync-stories-4h',
    '0 */4 * * *',
    $$ SELECT trigger_stories_sync() $$
);
