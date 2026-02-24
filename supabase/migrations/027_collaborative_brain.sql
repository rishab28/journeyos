-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Collaborative Brain Migration
-- Enabling Squad Intelligence & Social Learning
-- ═══════════════════════════════════════════════════════════

-- 1. Squads Registry
CREATE TABLE squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Squad Membership
CREATE TABLE squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(squad_id, user_id)
);

-- 3. Shared Intelligence (Feed of cards/tricks/notes)
CREATE TABLE shared_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('card', 'story', 'note')),
    target_id UUID, -- References original card/story id
    title TEXT,
    content_snapshot JSONB DEFAULT '{}'::jsonb, -- Store snapshot for visibility
    created_at TIMESTAMPTZ DEFAULT now(),
    comment_count INTEGER DEFAULT 0
);

-- 4. Shared Intel Comments
CREATE TABLE shared_intel_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intel_id UUID REFERENCES shared_intel(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Squad Blindspots (Collective Failure Patterns)
CREATE TABLE squad_blindspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    failure_count INTEGER DEFAULT 0,
    member_failure_count INTEGER DEFAULT 0, -- Number of different members failing
    detected_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reviewing', 'resolved')),
    remediation_card_id UUID -- AI suggested card to fix the blindspot
);

-- ─── RLS POLICIES ──────────────────────────────────────────

ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_intel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_blindspots ENABLE ROW LEVEL SECURITY;

-- Squad Visibility: Members can see their own squads
CREATE POLICY "Squad members can view squad" ON squads
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM squad_members WHERE squad_id = squads.id AND user_id = auth.uid())
    );

-- Squad Creation: Any authenticated user can create a squad
CREATE POLICY "Users can create squads" ON squads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Membership Visibility: Members can see each other
CREATE POLICY "Squad members can view members" ON squad_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id = auth.uid())
    );

-- Intel Visibility: Members can see shared intel
CREATE POLICY "Squad members can view shared intel" ON shared_intel
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM squad_members WHERE squad_id = shared_intel.squad_id AND user_id = auth.uid())
    );

-- Intel Sharing: Members can share to their squad
CREATE POLICY "Squad members can share intel" ON shared_intel
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM squad_members WHERE squad_id = shared_intel.squad_id AND user_id = auth.uid())
    );

-- Comments Visibility
CREATE POLICY "Squad members can view comments" ON shared_intel_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_intel si
            JOIN squad_members sm ON si.squad_id = sm.squad_id
            WHERE si.id = shared_intel_comments.intel_id AND sm.user_id = auth.uid()
        )
    );

-- Intel Comments
CREATE POLICY "Squad members can comment" ON shared_intel_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shared_intel si
            JOIN squad_members sm ON si.squad_id = sm.squad_id
            WHERE si.id = shared_intel_comments.intel_id AND sm.user_id = auth.uid()
        )
    );

-- Blindspots Visibility
CREATE POLICY "Squad members can view blindspots" ON squad_blindspots
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM squad_members WHERE squad_id = squad_blindspots.squad_id AND user_id = auth.uid())
    );
