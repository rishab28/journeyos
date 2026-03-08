import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin: Recent Stories API
// GET /api/admin/recent-stories → Returns last 20 stories
// ═══════════════════════════════════════════════════════════

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from('daily_stories')
            .select('id, title, subject, syllabus_topic, source_url, metadata, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({ stories: [], error: error.message });
        }

        return NextResponse.json({ stories: data || [] });
    } catch (err: any) {
        return NextResponse.json({ stories: [], error: err.message }, { status: 500 });
    }
}
