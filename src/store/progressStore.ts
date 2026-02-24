// ═══════════════════════════════════════════════════════════
// JourneyOS — Progress Store ("Needle State")
// Tracks accuracy, streaks, daily goals, and rank probability
// Offline-First via IndexedDB + Sync Engine
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Subject, type SubjectStat, type UserProgress } from '@/types';
import { supabase } from '@/lib/core/supabase/client';
import { db } from '@/lib/core/db/indexedDB';
import { syncEngine } from '@/lib/core/db/syncEngine';

// Initialize subject stats
function initSubjectStats(): Record<Subject, SubjectStat> {
    const stats = {} as Record<Subject, SubjectStat>;
    Object.values(Subject).forEach((s) => {
        stats[s] = { total: 0, correct: 0, accuracy: 0 };
    });
    return stats;
}

// Calculate rank probability from accuracy + volume
function calculateRankProbability(
    accuracy: number,
    totalReviewed: number,
    currentStreak: number
): number {
    const volumeFactor = Math.min(totalReviewed / 100, 1) * 100;
    const streakFactor = Math.min(currentStreak / 20, 1) * 100;

    const probability =
        accuracy * 0.5 +
        volumeFactor * 0.3 +
        streakFactor * 0.2;

    return Math.round(Math.min(probability, 99.9) * 10) / 10;
}

interface ProgressStore extends UserProgress {
    // Daily goal
    dailyGoal: number;
    todayReviewed: number;
    dailyProgress: number; // 0 to 1

    // Sync state
    userId: string | null;
    isHydrated: boolean;
    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';

    // Personalization
    setUPSC_IQ: (iq: number) => void;
    setInterestProfile: (profile: string) => void;
    setTargetExamDate: (dateStr: string) => void;
    lastNeuralCalibration: string | null;

    // Delayed Auth Flow
    swipeCount: number;
    showAuthModal: boolean;
    setSwipeCount: (count: number) => void;
    setShowAuthModal: (show: boolean) => void;
    incrementSwipeCount: () => void;

    // Actions
    recordAnswer: (subject: Subject, isCorrect: boolean) => void;
    setDailyGoal: (goal: number) => void;
    reset: () => void;

    // Hydration & Sync
    hydrate: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>()(
    persist(
        (set, get) => ({
            totalReviewed: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracy: 0,
            currentStreak: 0,
            bestStreak: 0,
            rankProbability: 0,
            subjectStats: initSubjectStats(),

            upscIQ: 0,
            interestProfile: 'Geopolitics',
            targetExamDate: '2025-05-25T00:00:00.000Z',
            dailyGoal: 20,
            todayReviewed: 0,
            dailyProgress: 0,
            lastNeuralCalibration: null,

            userId: null,
            isHydrated: false,
            syncStatus: 'idle',
            swipeCount: 0,
            showAuthModal: false,

            setSwipeCount: (count) => set({ swipeCount: count }),
            setShowAuthModal: (show) => set({ showAuthModal: show }),
            incrementSwipeCount: () => {
                const newCount = get().swipeCount + 1;
                set({ swipeCount: newCount });
                if (!get().userId && newCount === 5) {
                    set({ showAuthModal: true });
                }
            },

            hydrate: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) set({ userId: user.id });

                    // 1. Try to load from IndexedDB
                    let localProfile = await db.profiles.toCollection().first();
                    let localProgress = await db.userProgress.toCollection().first();

                    // 2. If IDB is empty and logged in, force a pull
                    if ((!localProfile || !localProgress) && user) {
                        set({ syncStatus: 'syncing' });
                        await syncEngine.pullLatestData();
                        localProfile = await db.profiles.toCollection().first();
                        localProgress = await db.userProgress.toCollection().first();
                        set({ syncStatus: 'synced' });
                    }

                    // 3. Apply state
                    if (localProgress) {
                        const today = new Date().toISOString().split('T')[0];
                        const todayReviewed = localProgress.last_review_date === today ? localProgress.today_reviewed : 0;
                        const total = (localProgress.correct_count || 0) + (localProgress.incorrect_count || 0);

                        set({
                            correctCount: localProgress.correct_count || 0,
                            incorrectCount: localProgress.incorrect_count || 0,
                            totalReviewed: total,
                            accuracy: total > 0 ? Math.round((localProgress.correct_count / total) * 1000) / 10 : 0,
                            subjectStats: localProgress.subject_stats || initSubjectStats(),
                            dailyGoal: localProgress.daily_goal || 20,
                            todayReviewed,
                            dailyProgress: Math.min(todayReviewed / (localProgress.daily_goal || 20), 1),
                        });
                    }

                    if (localProfile) {
                        set({
                            upscIQ: localProfile.upsc_iq || 0,
                            interestProfile: localProfile.interest_profile || 'Geopolitics',
                            currentStreak: localProfile.current_streak || 0,
                            bestStreak: localProfile.best_streak || 0,
                            rankProbability: calculateRankProbability(get().accuracy, localProfile.total_reviewed || 0, localProfile.current_streak || 0),
                        });
                    }

                    set({ isHydrated: true });
                } catch (error) {
                    console.error('[ProgressStore] Hydration failed:', error);
                    set({ isHydrated: true });
                }
            },

            setUPSC_IQ: async (iq) => {
                set({ upscIQ: iq, rankProbability: calculateRankProbability(get().accuracy, get().totalReviewed, get().currentStreak) });
                await db.profiles.where('user_id').equals(get().userId || '').modify({ upsc_iq: iq });
                await db.syncQueue.add({
                    type: 'progress',
                    synced: 0,
                    timestamp: new Date().toISOString(),
                    data: { type: 'profile', update: { upsc_iq: iq } }
                } as any);
                syncEngine.pushLocalChanges();
            },

            setTargetExamDate: async (dateStr) => {
                set({ targetExamDate: dateStr });
                const { userId } = get();
                if (userId) {
                    try {
                        await supabase.from('profiles').update({ target_exam_date: dateStr } as any).eq('id', userId);
                    } catch (e) {
                        console.error("Could not sync exam date:", e);
                    }
                }
            },

            setInterestProfile: async (profile) => {
                set({ interestProfile: profile });
                await db.profiles.where('user_id').equals(get().userId || '').modify({ interest_profile: profile });
                await db.syncQueue.add({
                    type: 'progress',
                    synced: 0,
                    timestamp: new Date().toISOString(),
                    data: { type: 'profile', update: { interest_profile: profile } }
                } as any);
                syncEngine.pushLocalChanges();
            },

            recordAnswer: async (subject: Subject, isCorrect: boolean) => {
                const state = get();
                const totalReviewed = state.totalReviewed + 1;
                const todayReviewed = state.todayReviewed + 1;
                const correctCount = state.correctCount + (isCorrect ? 1 : 0);
                const incorrectCount = state.incorrectCount + (isCorrect ? 0 : 1);
                const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 1000) / 10 : 0;
                const currentStreak = isCorrect ? state.currentStreak + 1 : 0;
                const bestStreak = Math.max(state.bestStreak, currentStreak);

                const subjectStats = { ...state.subjectStats };
                const subStat = subjectStats[subject];
                subjectStats[subject] = {
                    total: subStat.total + 1,
                    correct: subStat.correct + (isCorrect ? 1 : 0),
                    accuracy: subStat.total + 1 > 0 ? Math.round(((subStat.correct + (isCorrect ? 1 : 0)) / (subStat.total + 1)) * 1000) / 10 : 0,
                };

                const rankProbability = calculateRankProbability(accuracy, totalReviewed, currentStreak);
                const dailyProgress = Math.min(todayReviewed / state.dailyGoal, 1);
                const lastNeuralCalibration = totalReviewed % 5 === 0 ? new Date().toISOString() : state.lastNeuralCalibration;

                set({
                    totalReviewed,
                    todayReviewed,
                    correctCount,
                    incorrectCount,
                    accuracy,
                    currentStreak,
                    bestStreak,
                    rankProbability,
                    subjectStats,
                    dailyProgress,
                    lastNeuralCalibration,
                });

                // --- Persistence ---
                const progressUpdate = {
                    subject_stats: subjectStats,
                    total_accuracy: accuracy,
                    correct_count: correctCount,
                    incorrect_count: incorrectCount,
                    daily_goal: state.dailyGoal,
                    today_reviewed: todayReviewed,
                    last_review_date: new Date().toISOString().split('T')[0],
                };

                if (state.userId) {
                    await db.userProgress.put({ user_id: state.userId, ...progressUpdate });
                    await db.profiles.where('user_id').equals(state.userId).modify({
                        current_streak: currentStreak,
                        best_streak: bestStreak,
                        total_reviewed: totalReviewed
                    });
                }

                await db.syncQueue.add({
                    type: 'progress',
                    synced: 0,
                    timestamp: new Date().toISOString(),
                    data: { type: 'user_progress', update: progressUpdate }
                } as any);

                syncEngine.pushLocalChanges();
            },

            setDailyGoal: async (goal: number) => {
                const state = get();
                set({ dailyGoal: goal, dailyProgress: Math.min(state.todayReviewed / goal, 1) });

                if (state.userId) {
                    await db.userProgress.where('user_id').equals(state.userId).modify({ daily_goal: goal });
                }

                await db.syncQueue.add({
                    type: 'progress',
                    synced: 0,
                    timestamp: new Date().toISOString(),
                    data: { type: 'user_progress', update: { daily_goal: goal } }
                } as any);
                syncEngine.pushLocalChanges();
            },

            reset: () => {
                set({
                    totalReviewed: 0,
                    correctCount: 0,
                    incorrectCount: 0,
                    accuracy: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    rankProbability: 0,
                    subjectStats: initSubjectStats(),
                    todayReviewed: 0,
                    dailyProgress: 0,
                });
            },
        }),
        {
            name: 'journey-progress-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                upscIQ: state.upscIQ,
                interestProfile: state.interestProfile,
                dailyGoal: state.dailyGoal,
            }),
        }
    )
);
