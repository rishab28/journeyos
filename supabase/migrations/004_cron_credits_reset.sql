-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Migration 004: Daily AI Credits Reset
-- Uses pg_cron to reset all users' daily AI credits to 5 every midnight (IST)
-- ═══════════════════════════════════════════════════════════

-- Ensure pg_cron extension exists (Supported on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the function to reset daily AI credits
CREATE OR REPLACE FUNCTION reset_daily_ai_credits()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET daily_ai_credits = 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run at Midnight IST (18:30 UTC)
SELECT cron.schedule(
    'reset-ai-credits-midnight-ist',
    '30 18 * * *',
    $$ SELECT reset_daily_ai_credits() $$
);
