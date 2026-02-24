// ═══════════════════════════════════════════════════════════
// JourneyOS — SRS Store (IndexedDB + Background Sync)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    StudyCard,
    CardType,
    Difficulty,
    CardStatus,
    Subject,
    ReviewQuality,
    ReviewResponse,
    SRSData,
    Domain
} from '@/types';
import { cognitiveEngine } from '@/lib/learner/CognitiveTracker';
import { staminaEngine } from '@/lib/learner/StaminaOptimizer';
import { calculateFSRS, FSRSData } from '@/lib/learner/algorithms/fsrs';
import { db } from '@/lib/core/db/indexedDB';
import { syncEngine } from '@/lib/core/db/syncEngine';

// ─── Store Interface ────────────────────────────────────────

interface SRSStore {
    cards: StudyCard[];
    currentIndex: number;
    reviewHistory: ReviewResponse[];
    isLoading: boolean;

    // Diagnostic Bomb State
    needsDiagnostic: boolean;
    diagnosticScore: number;
    hasPassedDiagnostic: boolean;

    // Cognitive Load Handler (Burnout Tracking)
    sessionStartMs: number;
    fastSwipeCount: number;
    isBurnoutMode: boolean;
    burnoutEasyCardsRemaining: number;

    recentResults: boolean[];
    isStoicIntervention: boolean;

    // Mental Stamina Index
    msi: number;

    // Zero-Friction Listen Mode (Auto-play Reels)
    isListenMode: boolean;

    // Phase 6: Mastermind Filters
    activeSubject: Subject | 'Mixed';
    activeTopic: string | null;
    activeChapter: string | null;
    activeType: CardType | 'All';

    availableFilters: {
        subjects: Subject[];
        topics: string[];
        chapters: string[];
    };

    syncStatus: 'synced' | 'syncing' | 'error';
    feedScrollTrigger: number;
    upscIQ: number;
    subjectMastery: Record<string, number>;

    // Neural Core 2.0: Narrative Bridging
    lastCardTopic: string | null;
    causalBridgePrompt: string | null;

    // Actions
    fetchLiveCards: () => Promise<void>;
    fetchMoreCards: () => Promise<void>;
    submitReview: (cardId: string, recalled: boolean, failureReason?: string, certaintyScore?: number, timeToAnswerMs?: number) => Promise<void>;
    sync: () => Promise<void>;
    nextCard: () => void;
    previousCard: () => void;
    setCurrentIndex: (index: number) => void;
    setFilters: (filters: { subject?: Subject | 'Mixed', topic?: string | null, chapter?: string | null, type?: CardType | 'All' }) => void;
    resetDeck: () => void;
    resetBurnout: () => void;
    dismissStoicIntervention: () => void;
    completeDiagnostic: (score: number) => void;
    toggleListenMode: () => void;
    triggerFeedScroll: () => void;
}

export const useSRSStore = create<SRSStore>()(
    persist(
        (set, get) => ({
            cards: [],
            currentIndex: 0,
            reviewHistory: [],
            isLoading: true,

            needsDiagnostic: true,
            diagnosticScore: 0,
            hasPassedDiagnostic: false,

            sessionStartMs: Date.now(),
            fastSwipeCount: 0,
            isBurnoutMode: false,
            burnoutEasyCardsRemaining: 0,
            recentResults: [],
            isStoicIntervention: false,
            msi: 100,
            isListenMode: false,

            activeSubject: 'Mixed',
            activeTopic: null,
            activeChapter: null,
            activeType: 'All',
            syncStatus: 'synced',
            feedScrollTrigger: 0,
            upscIQ: 0,
            subjectMastery: {},

            lastCardTopic: null,
            causalBridgePrompt: null,

            availableFilters: {
                subjects: [],
                topics: [],
                chapters: []
            },

            sync: async () => {
                set({ syncStatus: 'syncing' });
                const pullRes = await syncEngine.pullLatestData();
                syncEngine.pushLocalChanges().then((res: any) => {
                    if (res.success) set({ syncStatus: 'synced' });
                    else set({ syncStatus: 'error' });
                });

                if (pullRes.success) {
                    if ((pullRes.pulledCards || 0) > 0) {
                        get().fetchLiveCards();
                    }
                } else {
                    set({ syncStatus: 'error' });
                }
            },

            completeDiagnostic: (score: number) => {
                const passed = score >= 4;
                set({ needsDiagnostic: false, diagnosticScore: score, hasPassedDiagnostic: passed });
                get().fetchLiveCards();
            },

            toggleListenMode: () => set((state) => ({ isListenMode: !state.isListenMode })),

            setFilters: (filters) => {
                set((state) => ({
                    ...state,
                    activeSubject: filters.subject !== undefined ? filters.subject : state.activeSubject,
                    activeTopic: filters.topic !== undefined ? filters.topic : state.activeTopic,
                    activeChapter: filters.chapter !== undefined ? filters.chapter : state.activeChapter,
                    activeType: filters.type !== undefined ? filters.type : state.activeType,
                }));
                get().fetchLiveCards();
            },

            fetchLiveCards: async () => {
                set({ isLoading: true, sessionStartMs: Date.now(), fastSwipeCount: 0, isBurnoutMode: false });
                try {
                    const { activeSubject, activeTopic, activeChapter, activeType } = get();

                    let dexieCards = await db.cards.toArray();

                    if (dexieCards.length === 0) {
                        set({ syncStatus: 'syncing' });
                        await syncEngine.pullLatestData();
                        dexieCards = await db.cards.toArray();
                        set({ syncStatus: 'synced' });
                    }

                    let filteredCards = dexieCards.filter(c => c.status === CardStatus.LIVE);

                    if (activeType !== 'All') {
                        filteredCards = filteredCards.filter(c => c.type === activeType);
                    }
                    if (activeSubject !== 'Mixed') {
                        filteredCards = filteredCards.filter(c => c.subject === activeSubject);
                    }
                    if (activeTopic) {
                        filteredCards = filteredCards.filter(c => c.topic === activeTopic);
                    }
                    if (activeChapter) {
                        filteredCards = filteredCards.filter(c => c.subTopic === activeChapter);
                    }

                    if (filteredCards.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const { useProgressStore } = require('./progressStore');
                        const { upscIQ, accuracy } = useProgressStore.getState();

                        const finalFiltered = filteredCards.filter(row => {
                            const { hasPassedDiagnostic, activeSubject, activeTopic, activeChapter } = get();
                            if (activeSubject !== 'Mixed' || activeTopic || activeChapter) return true;
                            if (hasPassedDiagnostic && row.scaffoldLevel === 'Foundation') {
                                if (row.srs.repetitions > 2) return false;
                            }
                            if (upscIQ > 0 && upscIQ < 50 && accuracy < 80) {
                                return row.scaffoldLevel === 'Foundation';
                            }
                            return true;
                        });

                        const now = new Date();
                        const nowMs = now.getTime();
                        const currentHour = now.getHours();
                        const isPeakFocus = currentHour >= 8 && currentHour < 12;

                        const aliveCards = finalFiltered.filter(c => c.srs.interval <= 60);

                        aliveCards.sort((a, b) => {
                            const aDue = new Date(a.srs.nextReviewDate || a.createdAt).getTime() - nowMs;
                            const bDue = new Date(b.srs.nextReviewDate || b.createdAt).getTime() - nowMs;
                            let aW = 1 + ((a.priorityScore || 5) / 10) * 0.5;
                            let bW = 1 + ((b.priorityScore || 5) / 10) * 0.5;
                            if (isPeakFocus) {
                                if (a.difficulty === Difficulty.HARD) aW *= 1.2;
                                if (b.difficulty === Difficulty.HARD) bW *= 1.2;
                            } else {
                                if (a.difficulty === Difficulty.EASY || a.topperTrick) aW *= 1.2;
                                if (b.difficulty === Difficulty.EASY || b.topperTrick) bW *= 1.2;
                            }
                            return (aDue / aW) - (bDue / bW);
                        });

                        const isMastermindMode = activeSubject !== 'Mixed' || activeTopic || activeChapter || activeType !== 'All';
                        let finalFeed: StudyCard[] = [];

                        if (isMastermindMode) {
                            finalFeed = aliveCards.slice(0, 50);
                        } else {
                            // Phase 22: NEURAL FOCUS (Auto-Priority)
                            const { subjectStats } = useProgressStore.getState();
                            let weakestSubject = null;
                            let lowestAccuracy = 100;

                            for (const [subj, stat] of Object.entries(subjectStats)) {
                                const s = stat as any;
                                if (s.total > 10 && s.accuracy < lowestAccuracy) {
                                    lowestAccuracy = s.accuracy;
                                    weakestSubject = subj;
                                }
                            }

                            const pyqs = aliveCards.filter(c => c.type === CardType.PYQ);
                            const predicted = aliveCards.filter(c => (c.oracleConfidence || 0) > 80);
                            const ca = aliveCards.filter(c => c.subject === Subject.CURRENT_AFFAIRS);
                            const neuralFocus = weakestSubject ? aliveCards.filter(c => c.subject === weakestSubject && c.type !== CardType.PYQ) : [];

                            const others = aliveCards.filter(c => c.type !== CardType.PYQ && (c.oracleConfidence || 0) <= 80 && c.subject !== Subject.CURRENT_AFFAIRS && c.subject !== weakestSubject);

                            const targetCount = 20;
                            const pCount = Math.ceil(targetCount * 0.2);
                            const prCount = Math.ceil(targetCount * 0.2);
                            const focusCount = Math.ceil(targetCount * 0.4); // 40% priority to weakest subject (Neural Focus)
                            const cCount = Math.ceil(targetCount * 0.2);

                            finalFeed = [...pyqs.slice(0, pCount), ...predicted.slice(0, prCount), ...neuralFocus.slice(0, focusCount), ...ca.slice(0, cCount)];
                            if (finalFeed.length < targetCount) {
                                finalFeed = [...finalFeed, ...others.slice(0, targetCount - finalFeed.length)];
                            }
                            finalFeed.sort(() => Math.random() - 0.5);
                        }

                        const subjects = Array.from(new Set(dexieCards.map(c => c.subject as Subject)));
                        const topics = Array.from(new Set(dexieCards.map(c => c.topic).filter(Boolean))) as string[];
                        const chapters = Array.from(new Set(dexieCards.map(c => c.subTopic).filter(Boolean))) as string[];

                        // Phase 23: Neural Subject Mastery (True Stability)
                        const masteryTemp: Record<string, { stabilitySum: number; count: number }> = {};
                        for (const card of dexieCards) {
                            if (!masteryTemp[card.subject]) masteryTemp[card.subject] = { stabilitySum: 0, count: 0 };
                            const stability = (card.srs as any).stability || card.srs.interval || 0;
                            // 21 days stability is considered 100% mastery for a card
                            masteryTemp[card.subject].stabilitySum += Math.min(stability, 21);
                            masteryTemp[card.subject].count += 1;
                        }
                        const subjectMastery: Record<string, number> = {};
                        for (const [subj, data] of Object.entries(masteryTemp)) {
                            subjectMastery[subj] = data.count > 0 ? Math.round((data.stabilitySum / (data.count * 21)) * 100) : 0;
                        }

                        set({
                            cards: finalFeed,
                            isLoading: false,
                            currentIndex: 0,
                            availableFilters: { subjects, topics, chapters },
                            subjectMastery
                        });
                    } else {
                        set({ cards: [], isLoading: false, currentIndex: 0 });
                    }
                } catch (err) {
                    console.error('[SRSStore] Fetch Error:', err);
                    set({ isLoading: false });
                }
            },

            fetchMoreCards: async () => {
                return;
            },

            submitReview: async (cardId, recalled, failureReason, certaintyScore, timeToAnswerMs) => {
                const quality = recalled ? ReviewQuality.CORRECT_HESITATION : ReviewQuality.BLACKOUT;
                const { cards, currentIndex, upscIQ, recentResults, fastSwipeCount, burnoutEasyCardsRemaining, sessionStartMs } = get();
                const cardIndex = cards.findIndex((c) => c.id === cardId);
                if (cardIndex === -1) return;

                const card = cards[cardIndex];

                const newRecent = [...recentResults, recalled].slice(-10);
                let newStoic = get().isStoicIntervention;
                if (newRecent.length === 10 && newRecent.filter(r => !r).length >= 7) {
                    newStoic = true;
                    newRecent.length = 0;
                }

                const now = Date.now();
                const timeSpent = now - sessionStartMs;
                let newBurnoutRem = burnoutEasyCardsRemaining > 0 ? burnoutEasyCardsRemaining - 1 : 0;
                const newFastCount = timeSpent < 2000 ? fastSwipeCount + 1 : 0;
                const newBurnout = newFastCount >= 3;
                if (newBurnout && newFastCount === 3) newBurnoutRem = 5;

                const { useProgressStore } = require('./progressStore');
                const targetExamDate = useProgressStore.getState().targetExamDate;

                const currentFSRS: FSRSData = {
                    ...card.srs,
                    stability: (card.srs as any).stability || card.srs.interval || 1,
                    difficulty: (card.srs as any).difficulty || (card.difficulty === Difficulty.HARD ? 7.5 : card.difficulty === Difficulty.MEDIUM ? 5 : 2.5),
                };

                // Phase 15: Calculate Lethality Weight for Adaptive Scaling
                // 1.0 (Baseline) -> 1.5 (Maximum Dampening)
                const priorityWeight = ((card.priorityScore || 5) / 10) * 0.3; // Up to 0.3
                const oracleWeight = ((card.oracleConfidence || 0) / 100) * 0.2; // Up to 0.2
                const lethalityWeight = 1.0 + priorityWeight + oracleWeight;

                const newFSRS = calculateFSRS(quality, currentFSRS, certaintyScore, upscIQ, false, targetExamDate, lethalityWeight);
                const srsData: SRSData = {
                    ...newFSRS,
                    easeFactor: newFSRS.easeFactor,
                    interval: newFSRS.interval,
                    repetitions: newFSRS.repetitions,
                    nextReviewDate: newFSRS.nextReviewDate,
                    lastReviewDate: new Date().toISOString(),
                };

                const cognitiveMetrics = cognitiveEngine.evaluateHesitation(card.scaffoldLevel || 'Intermediate', quality);
                const { msi } = staminaEngine.getCurrentStamina();

                const lastTopic = get().lastCardTopic;
                const bridge = lastTopic ? (lastTopic === card.topic ? `Continuity: ${card.topic}` : `${lastTopic} → ${card.topic}`) : null;

                const updatedCards = [...cards];
                updatedCards[cardIndex] = { ...card, srs: srsData, updatedAt: new Date().toISOString() };

                await db.cards.update(cardId, { srs: srsData, updatedAt: new Date().toISOString() });
                await db.syncQueue.add({
                    cardId,
                    quality,
                    timestamp: new Date().toISOString(),
                    synced: 0,
                    type: 'review',
                    failureReason,
                    certaintyScore,
                    timeToAnswerMs
                });

                if (newBurnoutRem === 5 && currentIndex < updatedCards.length - 1) {
                    const consumed = updatedCards.slice(0, currentIndex + 1);
                    const remaining = updatedCards.slice(currentIndex + 1);
                    const easy = remaining.filter(c => c.difficulty === Difficulty.EASY || c.topperTrick);
                    const rest = remaining.filter(c => !(c.difficulty === Difficulty.EASY || c.topperTrick));
                    updatedCards.splice(0, updatedCards.length, ...consumed, ...easy.slice(0, 5), ...easy.slice(5), ...rest);
                }

                set({
                    cards: updatedCards,
                    sessionStartMs: now,
                    fastSwipeCount: newFastCount,
                    isBurnoutMode: newBurnout,
                    burnoutEasyCardsRemaining: newBurnoutRem,
                    recentResults: newRecent,
                    isStoicIntervention: newStoic,
                    msi,
                    syncStatus: 'syncing',
                    lastCardTopic: card.topic,
                    causalBridgePrompt: bridge
                });

                syncEngine.pushLocalChanges().then((res: any) => {
                    if (res?.success) set({ syncStatus: 'synced' });
                });
            },

            nextCard: () => {
                const { currentIndex, cards } = get();
                if (currentIndex < cards.length - 1) set({ currentIndex: currentIndex + 1 });
            },

            previousCard: () => {
                const { currentIndex } = get();
                if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
            },

            setCurrentIndex: (index) => set({ currentIndex: index, sessionStartMs: Date.now() }),
            resetDeck: () => get().fetchLiveCards(),
            resetBurnout: () => set({ isBurnoutMode: false, fastSwipeCount: 0, sessionStartMs: Date.now(), burnoutEasyCardsRemaining: 0 }),
            dismissStoicIntervention: () => set({ isStoicIntervention: false, sessionStartMs: Date.now() }),
            triggerFeedScroll: () => set((state) => ({ feedScrollTrigger: state.feedScrollTrigger + 1 }))
        }),
        {
            name: 'journey-srs-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                needsDiagnostic: state.needsDiagnostic,
                hasPassedDiagnostic: state.hasPassedDiagnostic,
                activeSubject: state.activeSubject,
                activeTopic: state.activeTopic,
                activeChapter: state.activeChapter,
                isListenMode: state.isListenMode,
            }),
        }
    )
);
