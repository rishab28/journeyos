-- ═══════════════════════════════════════════════════════════
-- JourneyOS — Source Metadata Migration
-- Supports Virtual Folders and Source Organization
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.source_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL UNIQUE,       -- Matches the key in storage.objects
    display_name TEXT,
    folder_name TEXT DEFAULT 'Uncategorized',
    domain TEXT DEFAULT 'GS',
    subject TEXT,
    card_yield INTEGER DEFAULT 0,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_metadata_filename ON public.source_metadata(filename);
CREATE INDEX IF NOT EXISTS idx_source_metadata_folder ON public.source_metadata(folder_name);

-- RLS: Admin only access
ALTER TABLE public.source_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage source metadata" ON public.source_metadata;
CREATE POLICY "Admins manage source metadata" ON public.source_metadata
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS source_metadata_updated_at ON public.source_metadata;
CREATE TRIGGER source_metadata_updated_at
    BEFORE UPDATE ON public.source_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
