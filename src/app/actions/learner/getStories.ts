'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Stories Fetcher
// Fetches active (unexpired) current affair stories
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { CurrentAffairStory, StudyCard, Subject } from '@/types';

const DEMO_STORIES: CurrentAffairStory[] = [
    {
        id: 'demo-1',
        subject: Subject.POLITY,
        title: 'Supreme Court on Electoral Bonds',
        content: [
            'Supreme Court struck down the Electoral Bonds scheme as unconstitutional.',
            'UPSC Relevance: GS Paper 2 - Transparency in electoral funding.'
        ],
        syllabusTopic: 'Electoral Reforms',
        mainsFodder: 'Transparency in political funding is bedrock of free and fair elections - SC',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
    },
    {
        id: 'demo-2',
        subject: Subject.ECONOMY,
        title: 'RBI Monetary Policy Update',
        content: [
            'RBI maintained the repo rate at 6.5% for the sixth consecutive meeting.',
            'UPSC Relevance: GS Paper 3 - Indian Economy and issues related to planning, mobilization of resources.'
        ],
        syllabusTopic: 'Monetary Policy',
        mainsFodder: 'Balanced inflation targeting is crucial for sustainable growth trajectory - RBI Governor',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'demo-3',
        subject: Subject.ENVIRONMENT,
        title: 'COP28 Global Stocktake',
        content: [
            'Countries at COP28 agreed to transition away from fossil fuels in energy systems.',
            'UPSC Relevance: GS Paper 3 - Conservation, environmental pollution and degradation.'
        ],
        syllabusTopic: 'Climate Change',
        mainsFodder: 'The first Global Stocktake marks the beginning of the end for the fossil fuel era.',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 7200000).toISOString()
    }
];

export async function getActiveStories(): Promise<{ success: boolean; stories: CurrentAffairStory[]; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();
        const now = new Date().toISOString();

        console.log(`[getActiveStories] Initiating optimized fetch at ${now}`);

        // 1. Parallel Fetch for Speed (Decoupled)
        const [legacyRes, dailyRes] = await Promise.all([
            supabase
                .from('stories')
                .select('id, subject, content, mcq_id, expires_at, created_at')
                .gt('expires_at', now)
                .order('created_at', { ascending: false }),
            supabase
                .from('daily_stories')
                .select('*')
                .gt('expires_at', now)
                .order('created_at', { ascending: false })
        ]);

        if (legacyRes.error) console.error('[getActiveStories] Legacy Table Error:', legacyRes.error.message);
        if (dailyRes.error) console.error('[getActiveStories] Daily Table Error:', dailyRes.error.message);

        // 2. Fast Mapping (No nested joins)
        const parsedLegacy: CurrentAffairStory[] = (legacyRes.data || []).map(row => ({
            id: row.id,
            subject: row.subject as Subject,
            content: Array.isArray(row.content) ? row.content : [],
            mcqId: row.mcq_id || undefined,
            expiresAt: row.expires_at,
            createdAt: row.created_at
        }));

        const parsedDaily: CurrentAffairStory[] = (dailyRes.data || []).map(row => ({
            id: row.id,
            subject: row.subject as Subject,
            title: row.title,
            summary: Array.isArray(row.summary) ? row.summary : [],
            syllabusTopic: row.syllabus_topic,
            mainsFodder: row.mains_fodder,
            sourceUrl: row.source_url || undefined,
            sourceName: row.metadata?.source || undefined,
            expiresAt: row.expires_at,
            createdAt: row.created_at || new Date().toISOString(),
            cardId: row.card_id || undefined,
            content: [row.title] // Component fallback
        }));

        const allStories = [...parsedDaily, ...parsedLegacy].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (allStories.length === 0) {
            console.log('[getActiveStories] No active stories found. Providing Demo Fallback.');
            return { success: true, stories: DEMO_STORIES };
        }

        console.log(`[getActiveStories] Success: Resolved ${allStories.length} stories.`);
        return { success: true, stories: allStories };

    } catch (err: any) {
        console.error('[getActiveStories] Critical Failure:', err);
        return { success: false, stories: [], error: err.message || 'Failed to fetch stories.' };
    }
}
