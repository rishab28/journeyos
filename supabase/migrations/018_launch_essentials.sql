-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Launch Essentials Migration
-- Fixes profiles table (already exists) + adds new tables
-- ═══════════════════════════════════════════════════════════


-- ─── 1. PROFILES TABLE (Existing from 002_doubt_destroyer) ─

-- Safely add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upsc_iq INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interest_profile TEXT NOT NULL DEFAULT 'Geopolitics';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reviewed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Update RLS policies to use user_id instead of id
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Auto-trigger: create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Aspirant'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 2. USER PROGRESS TABLE ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- Links to auth.users.id
    subject_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_accuracy NUMERIC NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    daily_goal INTEGER NOT NULL DEFAULT 20,
    today_reviewed INTEGER NOT NULL DEFAULT 0,
    last_review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own progress" ON public.user_progress;
CREATE POLICY "Users read own progress" ON public.user_progress
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users upsert own progress" ON public.user_progress;
CREATE POLICY "Users upsert own progress" ON public.user_progress
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;
CREATE POLICY "Users update own progress" ON public.user_progress
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ─── 3. REVIEW HISTORY TABLE ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.review_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Links to auth.users.id
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL DEFAULT 0,       -- SM2 quality 0-5
    recalled BOOLEAN NOT NULL DEFAULT false,
    failure_reason TEXT,
    certainty_score INTEGER,                  -- 1-5
    time_to_answer_ms INTEGER,
    ease_factor NUMERIC NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_history_user ON public.review_history(user_id);
CREATE INDEX IF NOT EXISTS idx_review_history_card ON public.review_history(card_id);
CREATE INDEX IF NOT EXISTS idx_review_history_created ON public.review_history(created_at);

ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own reviews" ON public.review_history;
CREATE POLICY "Users read own reviews" ON public.review_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own reviews" ON public.review_history;
CREATE POLICY "Users insert own reviews" ON public.review_history
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Also allow anon inserts for now (MVP without forced login)
DROP POLICY IF EXISTS "Anon insert reviews" ON public.review_history;
CREATE POLICY "Anon insert reviews" ON public.review_history
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon read reviews" ON public.review_history;
CREATE POLICY "Anon read reviews" ON public.review_history
    FOR SELECT TO anon
    USING (true);


-- ─── 4. Updated_at triggers ────────────────────────────────

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_progress_updated_at ON public.user_progress;
CREATE TRIGGER user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
