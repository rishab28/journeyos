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

        console.log(`[getActiveStories] Fetching stories at ${now}`);

        // 1. Fetch from legacy 'stories' table
        const { data: legacyData, error: legacyError } = await supabase
            .from('stories')
            .select(`
                *,
                mcqCard:cards(*)
            `)
            .gt('expires_at', now)
            .order('created_at', { ascending: false });

        if (legacyError) console.warn('[getActiveStories] Legacy Table Error:', legacyError.message);
        console.log(`[getActiveStories] Legacy stories found: ${legacyData?.length || 0}`);

        // 2. Fetch from new 'daily_stories' table (Surgical News Engine)
        const { data: dailyData, error: dailyError } = await supabase
            .from('daily_stories')
            .select('*')
            .gt('expires_at', now)
            .order('created_at', { ascending: false });

        if (dailyError) console.warn('[getActiveStories] Daily Table Error:', dailyError.message);
        console.log(`[getActiveStories] Daily stories found: ${dailyData?.length || 0}`);

        // 3. Map legacy stories
        const parsedLegacy: CurrentAffairStory[] = (legacyData || []).map(row => {
            let parsedMcq: StudyCard | undefined;
            if (row.mcqCard) {
                const dbCard = row.mcqCard;
                parsedMcq = {
                    id: dbCard.id,
                    type: dbCard.type as StudyCard['type'],
                    domain: dbCard.domain as StudyCard['domain'],
                    subject: dbCard.subject as StudyCard['subject'],
                    topic: dbCard.topic,
                    subTopic: dbCard.sub_topic || undefined,
                    difficulty: dbCard.difficulty as StudyCard['difficulty'],
                    examTags: dbCard.exam_tags,
                    status: dbCard.status as StudyCard['status'],
                    front: dbCard.front,
                    back: dbCard.back,
                    options: dbCard.options || undefined,
                    srs: {
                        easeFactor: dbCard.ease_factor,
                        interval: dbCard.interval,
                        repetitions: dbCard.repetitions,
                        nextReviewDate: dbCard.next_review_date,
                    },
                    createdAt: dbCard.created_at,
                    updatedAt: dbCard.updated_at,
                } as StudyCard;
            }

            return {
                id: row.id,
                subject: row.subject as Subject,
                content: Array.isArray(row.content) ? row.content : [],
                mcqId: row.mcq_id || undefined,
                expiresAt: row.expires_at,
                createdAt: row.created_at,
                mcqCard: parsedMcq
            };
        });

        // 4. Map daily stories (Surgical Format)
        const parsedDaily: CurrentAffairStory[] = (dailyData || []).map(row => {
            const content = [row.title, ...(Array.isArray(row.summary) ? row.summary : [])];

            return {
                id: row.id,
                subject: row.subject as Subject,
                title: row.title,
                content,
                syllabusTopic: row.syllabus_topic,
                mainsFodder: row.mains_fodder,
                expiresAt: row.expires_at,
                createdAt: row.created_at
            };
        });

        // Merge and sort
        let allStories = [...parsedDaily, ...parsedLegacy].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Demo Fallback if empty
        if (allStories.length === 0) {
            console.log('[getActiveStories] No active stories found in DB. Injecting demo fallback.');
            allStories = DEMO_STORIES;
        }

        return { success: true, stories: allStories };

    } catch (err: any) {
        console.error('[getActiveStories] Exception:', err);
        return { success: false, stories: [], error: err.message || 'Failed to fetch stories.' };
    }
}
