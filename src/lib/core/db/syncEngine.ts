import { supabase } from '@/lib/core/supabase/client';
import { db } from './indexedDB';
import { CardStatus, Subject, Domain, CardType } from '@/types';

/**
 * Laws of Sync:
 * 1. Delta Only: Only fetch what's changed since last sync.
 * 2. Local First: UI reads from IDB, Sync happens in background.
 * 3. Batching: Reviews are queued and pushed in chunks.
 */
export const syncEngine = {
    /**
     * Load Demo Content from static seed if the user is completely offline the first time they open the app
     */
    async loadDemoContent() {
        try {
            const demoData = await import('./demoSeed.json');
            const cards = demoData.default || demoData;

            const mappedCards = cards.map((c: any) => ({
                id: c.id,
                type: CardType.FLASHCARD,
                domain: Domain.GS,
                examTags: ['UPSC CSE'],
                front: c.front,
                back: c.back,
                explanation: c.explanation,
                customAnalogy: c.custom_analogy,
                subject: c.subject,
                topic: c.topic,
                subTopic: c.sub_topic,
                difficulty: c.difficulty_level,
                status: CardStatus.LIVE,
                srs: {
                    easeFactor: 2.5,
                    interval: 0,
                    repetitions: 0,
                    nextReviewDate: new Date().toISOString()
                },
                createdAt: c.created_at,
                updatedAt: c.updated_at
            }));

            await db.cards.bulkPut(mappedCards);
            console.log(`[SyncEngine] Loaded ${mappedCards.length} demo cards for offline use.`);
        } catch (e) {
            console.error('[SyncEngine] Failed to load offline demo content:', e);
        }
    },

    /**
     * Pull latest data from Supabase
     */
    async pullLatestData() {
        try {
            // Law #3: Offline-First zero-internet fallback
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return { success: false, error: 'Offline' };
            }

            const { data: { user } } = await supabase.auth.getUser();

            // Get the latest updatedAt timestamp from our local DB
            const lastCard = await db.cards.orderBy('updatedAt').last();
            const lastSyncTime = lastCard?.updatedAt || new Date(0).toISOString();

            // 1. Fetch ALL data via Server Action to bypass browser DNS SNI block
            const { pullSyncData } = await import('@/app/actions/intel/pullSyncData');
            const syncDataResult = await pullSyncData(lastSyncTime, user?.id);

            if (!syncDataResult.success) {
                throw new Error(syncDataResult.error || 'Failed to pull sync data');
            }

            const { cards: remoteCards, legacyStories: legacyStoriesRes, dailyStories: dailyStoriesRes, progress, squadMembers } = syncDataResult;

            if (remoteCards && remoteCards.length > 0) {
                // Filter for LIVE cards only as we previously did in the query
                const liveCards = remoteCards.filter((c: any) => c.status === CardStatus.LIVE);

                if (liveCards.length > 0) {
                    console.log(`[SyncEngine] Pulling ${liveCards.length} new/updated cards...`);

                    const mappedCards = liveCards.map((dbCard: any) => ({
                        id: dbCard.id,
                        type: dbCard.type,
                        domain: dbCard.domain,
                        subject: dbCard.subject,
                        topic: dbCard.topic,
                        subTopic: dbCard.sub_topic,
                        difficulty: dbCard.difficulty,
                        examTags: dbCard.exam_tags || [],
                        status: dbCard.status,
                        front: dbCard.front,
                        back: dbCard.back,
                        explanation: dbCard.explanation,
                        topperTrick: dbCard.topper_trick,
                        eliminationTrick: dbCard.elimination_trick,
                        mainsPoint: dbCard.mains_point,
                        syllabusTopic: dbCard.syllabus_topic,
                        crossRefs: dbCard.cross_refs,
                        logicDerivation: dbCard.logic_derivation,
                        interlinkIds: dbCard.interlink_ids,
                        isPyqTagged: dbCard.is_pyq_tagged,
                        pyqYears: dbCard.pyq_years,
                        currentAffairs: dbCard.current_affairs,
                        priorityScore: dbCard.priority_score,
                        options: typeof dbCard.options === 'string' ? JSON.parse(dbCard.options) : dbCard.options,
                        year: dbCard.year,
                        examName: dbCard.exam_name,
                        sourcePdf: dbCard.source_pdf,
                        scaffoldLevel: dbCard.scaffold_level,
                        customAnalogy: dbCard.custom_analogy,
                        srs: {
                            easeFactor: dbCard.ease_factor || 2.5,
                            interval: dbCard.interval || 0,
                            repetitions: dbCard.repetitions || 0,
                            nextReviewDate: dbCard.next_review_date,
                            lastReviewDate: dbCard.last_review_date,
                        },
                        createdAt: dbCard.created_at,
                        updatedAt: dbCard.updated_at,
                    }));

                    await db.cards.bulkPut(mappedCards);
                }
            }

            const remoteStories = legacyStoriesRes || [];
            const dailyStories = dailyStoriesRes || [];

            if (remoteStories.length > 0 || dailyStories.length > 0) {
                console.log(`[SyncEngine] Pulling ${remoteStories.length} legacy and ${dailyStories.length} daily stories...`);

                const mappedLegacy = remoteStories.map((s: any) => ({
                    id: s.id,
                    subject: s.subject as Subject,
                    title: s.title,
                    content: s.content,
                    syllabusTopic: s.syllabus_topic,
                    mainsFodder: s.mains_fodder,
                    mcqId: s.mcq_id,
                    expiresAt: s.expires_at,
                    createdAt: s.created_at,
                }));

                const mappedDaily = dailyStories.map((s: any) => ({
                    id: s.id,
                    subject: s.subject as Subject,
                    title: s.title,
                    content: [s.title],
                    summary: s.summary,
                    syllabusTopic: s.syllabus_topic,
                    mainsFodder: s.mains_fodder,
                    cardId: s.card_id,
                    expiresAt: s.expires_at,
                    createdAt: s.created_at,
                }));

                await db.stories.bulkPut([...mappedLegacy, ...mappedDaily]);
            }

            // 3. Pull Progress/Profile (If logged in)
            if (user) {
                if (progress) await db.userProgress.put(progress);

                // 4. Pull Squads
                if (squadMembers) {
                    await db.squads.bulkPut(squadMembers.map((m: any) => m.squads));
                    await db.squad_members.bulkPut(squadMembers.map((m: any) => ({
                        id: m.id,
                        squad_id: m.squad_id,
                        user_id: m.user_id,
                        role: m.role
                    })));

                    const squadIds = squadMembers.map((m: any) => m.squad_id);

                    // Call Server Action to bypass browser DNS SNI block
                    const { pullSharedIntel } = await import('@/app/actions/intel/pullSharedIntel');
                    const intelResult = await pullSharedIntel(squadIds, String(lastSyncTime));

                    if (intelResult.success && intelResult.data && intelResult.data.length > 0) {
                        await db.shared_intel.bulkPut(intelResult.data);
                    } else if (!intelResult.success) {
                        console.error('[SyncEngine] Shared Intel pull failed:', intelResult.error);
                    }
                }
            }

            await db.cleanupExpiredStories();

            return { success: true, pulledCards: remoteCards?.length || 0 };
        } catch (error) {
            console.error('[SyncEngine] Pull failed:', error);
            return { success: false, error };
        }
    },

    /**
     * Push pending local reviews and progress updates
     */
    async pushLocalChanges() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const pending = await db.syncQueue.where('synced').equals(0).toArray();
            if (pending.length === 0) return { success: true, pushed: 0 };

            console.log(`[SyncEngine] Pushing ${pending.length} changes...`);

            for (const item of pending) {
                try {
                    if (item.type === 'review') {
                        // Push SRS update to cards table
                        const card = await db.cards.get(item.cardId);
                        if (card) {
                            await supabase.from('cards').update({
                                ease_factor: card.srs.easeFactor,
                                interval: card.srs.interval,
                                repetitions: card.srs.repetitions,
                                next_review_date: card.srs.nextReviewDate,
                                last_review_date: card.srs.lastReviewDate,
                                updated_at: new Date().toISOString()
                            }).eq('id', item.cardId);

                            if (user) {
                                await supabase.from('review_history').insert({
                                    user_id: user.id,
                                    card_id: item.cardId,
                                    quality: item.quality,
                                    recalled: item.quality > 0,
                                    failure_reason: item.failureReason,
                                    certainty_score: item.certaintyScore,
                                    time_to_answer_ms: item.timeToAnswerMs,
                                    ease_factor: card.srs.easeFactor,
                                    interval: card.srs.interval,
                                    repetitions: card.srs.repetitions
                                });
                            }
                        }
                    } else if (item.type === 'progress' && user && item.data) {
                        // Push Progress/Profile updates
                        if (item.data.type === 'profile') {
                            await supabase.from('profiles').update(item.data.update).eq('user_id', user.id);
                        } else if (item.data.type === 'user_progress') {
                            await supabase.from('user_progress').upsert({
                                user_id: user.id,
                                ...item.data.update
                            }, { onConflict: 'user_id' });
                        }
                    }

                    await db.syncQueue.update(item.id!, { synced: 1 });
                } catch (err) {
                    console.error(`[SyncEngine] Failed to push item ${item.id}:`, err);
                }
            }

            return { success: true, pushed: pending.length };
        } catch (error) {
            console.error('[SyncEngine] pushLocalChanges failed:', error);
            return { success: false, error };
        }
    },

    /**
     * Initialize listeners for automatic synchronization
     */
    init() {
        if (typeof window === 'undefined') return;

        console.log('[SyncEngine] Initializing auto-sync listeners...');

        window.addEventListener('online', () => {
            console.log('[SyncEngine] Network back online. Triggering sync pulse...');
            this.pushLocalChanges();
            this.pullLatestData();
        });

        // Periodic sync every 2 minutes if online
        setInterval(() => {
            if (navigator.onLine) {
                this.pushLocalChanges();
            }
        }, 120000);
    }
};
