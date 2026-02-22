-- 020_foundation.sql
-- Missing Foundation Tables (review_history & profiles)

-- 1. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    upsc_iq integer DEFAULT 40,
    interest_profile text DEFAULT 'Geopolitics',
    current_streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    total_reviewed integer DEFAULT 0,
    last_active_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Review history table (tracking SRS performance)
CREATE TABLE IF NOT EXISTS public.review_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    quality integer NOT NULL CHECK (quality >= 1 AND quality <= 5),
    ease_factor numeric NOT NULL,
    interval integer NOT NULL,
    repetitions integer NOT NULL,
    recalled boolean,
    failure_reason text,
    certainty_score integer,
    time_to_answer_ms integer,
    created_at timestamptz DEFAULT now()
);

-- 3. User progress table (Daily stats and accuracy)
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_stats jsonb DEFAULT '{}'::jsonb,
    total_accuracy numeric DEFAULT 0,
    correct_count integer DEFAULT 0,
    incorrect_count integer DEFAULT 0,
    daily_goal integer DEFAULT 20,
    today_reviewed integer DEFAULT 0,
    last_review_date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Review History
DROP POLICY IF EXISTS "Users can view their own review history" ON public.review_history;
CREATE POLICY "Users can view their own review history" ON public.review_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own review history" ON public.review_history;
CREATE POLICY "Users can insert their own review history" ON public.review_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for User Progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their own progress" ON public.user_progress;
CREATE POLICY "Users can upsert their own progress" ON public.user_progress
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at in profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Patch oracle_calibrations table
ALTER TABLE public.oracle_calibrations 
ADD COLUMN IF NOT EXISTS match_percentage integer,
ADD COLUMN IF NOT EXISTS unpredicted_topics jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pattern_shift text,
ADD COLUMN IF NOT EXISTS causal_audit jsonb,
ADD COLUMN IF NOT EXISTS prediction_sets jsonb DEFAULT '[]'::jsonb;
