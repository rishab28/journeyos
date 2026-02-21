'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Stories Fetcher
// Fetches active (unexpired) current affair stories
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CurrentAffairStory, StudyCard } from '@/types';

export async function getActiveStories(): Promise<{ success: boolean; stories: CurrentAffairStory[]; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();

        // Fetch active stories and their related MCQ cards
        const { data, error } = await supabase
            .from('stories')
            .select(`
                *,
                mcqCard:cards(*)
            `)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getActiveStories] DB Error:', error);
            return { success: false, stories: [], error: error.message };
        }

        // Map and validate relationships
        const parsedStories: CurrentAffairStory[] = (data || []).map(row => {
            let parsedMcq: StudyCard | undefined;

            // Map the joined card if it exists
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
                } as StudyCard; // Casting simplified for brevity, in production we pull full mapper
            }

            return {
                id: row.id,
                subject: row.subject as CurrentAffairStory['subject'],
                content: row.content as string[],
                mcqId: row.mcq_id || undefined,
                expiresAt: row.expires_at,
                createdAt: row.created_at,
                mcqCard: parsedMcq
            };
        });

        return { success: true, stories: parsedStories };

    } catch (err: any) {
        console.error('[getActiveStories] Exception:', err);
        return { success: false, stories: [], error: err.message || 'Failed to fetch stories.' };
    }
}
