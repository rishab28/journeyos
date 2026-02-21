'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Discovery Feed Engine
// Weighted random algorithm:
// Weight A: Popularity (High Priority Score)
// Weight B: Diversity (Unseen Subjects)
// Weight C: Priority (High Lethality - PYQ Focus)
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StudyCard } from '@/types';

export async function getDiscoveryFeed(limit: number = 30): Promise<{ success: boolean; cards: StudyCard[]; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();

        // Grab a large random pool of LIVE cards
        // Phase 20: This will eventually be a raw SQL query or Edge Function for ultimate speed
        const { data: rawCards, error } = await supabase
            .from('cards')
            .select('*')
            .eq('status', 'live')
            .order('priority_score', { ascending: false }) // Weight A proxy
            .limit(limit * 3); // Get extra payload to filter and randomize down

        if (error) {
            console.error('[getDiscoveryFeed] DB Error:', error);
            return { success: false, cards: [], error: error.message };
        }

        if (!rawCards || rawCards.length === 0) {
            return { success: true, cards: [] };
        }

        // Shuffle cards for discovery utilizing a simple sort trick
        // (Simulates Weight B by breaking clustering)
        const shuffled = rawCards.sort(() => 0.5 - Math.random());

        // Weight C proxy: Put PYQs and high priority items near the top of the feed chunk
        const prioritized = shuffled.sort((a, b) => {
            const scoreA = (a.is_pyq_tagged ? 100 : 0) + (a.priority_score || 0);
            const scoreB = (b.is_pyq_tagged ? 100 : 0) + (b.priority_score || 0);
            return scoreB - scoreA;
        });

        // Cap to requested limit
        const finalBatch = prioritized.slice(0, limit);

        // Map to typescript model
        const mappedCards: StudyCard[] = finalBatch.map(dbCard => ({
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
            explanation: dbCard.explanation || undefined,
            topperTrick: dbCard.topper_trick || undefined,
            eliminationTrick: dbCard.elimination_trick || undefined,
            mainsPoint: dbCard.mains_point || undefined,
            syllabusTopic: dbCard.syllabus_topic || undefined,
            crossRefs: dbCard.cross_refs || undefined,
            logicDerivation: dbCard.logic_derivation || undefined,
            interlinkIds: dbCard.interlink_ids || undefined,
            isPyqTagged: dbCard.is_pyq_tagged,
            pyqYears: dbCard.pyq_years || undefined,
            currentAffairs: dbCard.current_affairs || undefined,
            priorityScore: dbCard.priority_score,
            scaffoldLevel: dbCard.scaffold_level,
            customAnalogy: dbCard.custom_analogy || undefined,
            isVerified: dbCard.is_verified,
            options: dbCard.options || undefined,
            year: dbCard.year || undefined,
            examName: dbCard.exam_name || undefined,
            sourcePdf: dbCard.source_pdf || undefined,
            srs: {
                easeFactor: dbCard.ease_factor,
                interval: dbCard.interval,
                repetitions: dbCard.repetitions,
                nextReviewDate: dbCard.next_review_date,
                lastReviewDate: dbCard.last_review_date || undefined,
            },
            createdAt: dbCard.created_at,
            updatedAt: dbCard.updated_at,
        }));

        return { success: true, cards: mappedCards };

    } catch (err: any) {
        console.error('[getDiscoveryFeed] Failed to generate discovery feed:', err);
        return { success: false, cards: [], error: err.message };
    }
}
