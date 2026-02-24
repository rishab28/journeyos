-- Migration: The Panopticon (Telemetry & Scale)
-- Description: Core tables for tracking DAU, session lengths, and individual cognitive actions.

-- 1. Track distinct user sessions (DAU/WAU calculation)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    device_type TEXT, -- 'mobile', 'desktop', 'tablet'
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Track granular cognitive actions (The Yield)
CREATE TABLE IF NOT EXISTS public.cognitive_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'card_swiped', 'ai_doubt', 'mains_submit', 'story_viewed'
    target_id UUID, -- References the specific card/story/mains question
    metadata JSONB DEFAULT '{}'::jsonb, -- Store specific details (e.g., swipe direction, time spent)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for blazing fast admin queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON public.user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_telemetry_user ON public.cognitive_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_action ON public.cognitive_telemetry(action_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON public.cognitive_telemetry(created_at);

-- Add helper columns to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
