// ═══════════════════════════════════════════════════════════
// JourneyOS — Progress Store ("Needle State")
// Tracks accuracy, streaks, daily goals, and rank probability
// Syncs to Supabase: profiles + user_progress tables
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { Subject, type SubjectStat, type UserProgress } from '@/types';
import { supabase } from '@/lib/supabase/client';

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

    // Actions
    recordAnswer: (subject: Subject, isCorrect: boolean) => void;
    setDailyGoal: (goal: number) => void;
    reset: () => void;

    // Supabase Sync
    hydrateFromSupabase: () => Promise<void>;
    syncToSupabase: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
    totalReviewed: 0,
    correctCount: 0,
    incorrectCount: 0,
    accuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    rankProbability: 0,
    subjectStats: initSubjectStats(),

    // Personalization
    upscIQ: 0,
    interestProfile: 'Geopolitics',

    // Daily goal
    dailyGoal: 20,
    todayReviewed: 0,
    dailyProgress: 0,

    // Sync state
    userId: null,
    isHydrated: false,
    syncStatus: 'idle',

    setUPSC_IQ: (iq) => {
        set({ upscIQ: iq });
        // Also sync to Supabase
        setTimeout(() => get().syncToSupabase(), 0);
    },
    setInterestProfile: (profile) => {
        set({ interestProfile: profile });
        setTimeout(() => get().syncToSupabase(), 0);
    },

    // ─── Hydrate from Supabase on App Load ──────────────────
    hydrateFromSupabase: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // No auth user — stay with local state (MVP mode)
                set({ isHydrated: true });
                return;
            }

            set({ userId: user.id });

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('upsc_iq, interest_profile, current_streak, best_streak, total_reviewed')
                .eq('user_id', user.id)
                .single();

            // Fetch progress
            const { data: progress } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .single();

            const today = new Date().toISOString().split('T')[0];
            let todayReviewed = 0;

            if (progress) {
                // Reset daily counter if it's a new day
                if (progress.last_review_date === today) {
                    todayReviewed = progress.today_reviewed || 0;
                }

                const totalReviewed = (progress.correct_count || 0) + (progress.incorrect_count || 0);
                const accuracy = totalReviewed > 0
                    ? Math.round((progress.correct_count / totalReviewed) * 1000) / 10
                    : 0;

                // Parse subject stats from JSONB (handle both fresh and existing)
                let subjectStats = initSubjectStats();
                if (progress.subject_stats && typeof progress.subject_stats === 'object') {
                    subjectStats = { ...subjectStats, ...progress.subject_stats };
                }

                set({
                    correctCount: progress.correct_count || 0,
                    incorrectCount: progress.incorrect_count || 0,
                    totalReviewed,
                    accuracy,
                    subjectStats,
                    dailyGoal: progress.daily_goal || 20,
                    todayReviewed,
                    dailyProgress: Math.min(todayReviewed / (progress.daily_goal || 20), 1),
                });
            }

            if (profile) {
                const rankProbability = calculateRankProbability(
                    get().accuracy,
                    profile.total_reviewed || 0,
                    profile.current_streak || 0
                );

                set({
                    upscIQ: profile.upsc_iq || 0,
                    interestProfile: profile.interest_profile || 'Geopolitics',
                    currentStreak: profile.current_streak || 0,
                    bestStreak: profile.best_streak || 0,
                    rankProbability,
                });
            }

            set({ isHydrated: true });
        } catch (error) {
            console.warn('[ProgressStore] Hydration failed (probably no auth):', error);
            set({ isHydrated: true }); // Allow app to proceed even without auth
        }
    },

    // ─── Sync to Supabase (Background, Fire-and-Forget) ────
    syncToSupabase: async () => {
        const state = get();
        if (!state.userId) return; // No auth user — skip sync

        set({ syncStatus: 'syncing' });

        try {
            // Update profiles
            await supabase
                .from('profiles')
                .update({
                    upsc_iq: state.upscIQ,
                    interest_profile: state.interestProfile,
                    current_streak: state.currentStreak,
                    best_streak: state.bestStreak,
                    total_reviewed: state.totalReviewed,
                })
                .eq('user_id', state.userId);

            // Upsert user_progress
            await supabase
                .from('user_progress')
                .upsert({
                    user_id: state.userId,
                    subject_stats: state.subjectStats,
                    total_accuracy: state.accuracy,
                    correct_count: state.correctCount,
                    incorrect_count: state.incorrectCount,
                    daily_goal: state.dailyGoal,
                    today_reviewed: state.todayReviewed,
                    last_review_date: new Date().toISOString().split('T')[0],
                }, { onConflict: 'user_id' });

            set({ syncStatus: 'synced' });
        } catch (error) {
            console.error('[ProgressStore] Sync failed:', error);
            set({ syncStatus: 'error' });
        }
    },

    recordAnswer: (subject: Subject, isCorrect: boolean) => {
        const state = get();
        const totalReviewed = state.totalReviewed + 1;
        const todayReviewed = state.todayReviewed + 1;
        const correctCount = state.correctCount + (isCorrect ? 1 : 0);
        const incorrectCount = state.incorrectCount + (isCorrect ? 0 : 1);
        const accuracy =
            totalReviewed > 0
                ? Math.round((correctCount / totalReviewed) * 1000) / 10
                : 0;

        const currentStreak = isCorrect ? state.currentStreak + 1 : 0;
        const bestStreak = Math.max(state.bestStreak, currentStreak);

        // Update subject stat
        const subjectStats = { ...state.subjectStats };
        const subStat = subjectStats[subject];
        subjectStats[subject] = {
            total: subStat.total + 1,
            correct: subStat.correct + (isCorrect ? 1 : 0),
            accuracy:
                subStat.total + 1 > 0
                    ? Math.round(
                        ((subStat.correct + (isCorrect ? 1 : 0)) /
                            (subStat.total + 1)) *
                        1000
                    ) / 10
                    : 0,
        };

        const rankProbability = calculateRankProbability(
            accuracy,
            totalReviewed,
            currentStreak
        );

        const dailyProgress = Math.min(todayReviewed / state.dailyGoal, 1);

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
        });

        // Background sync to Supabase (non-blocking)
        setTimeout(() => get().syncToSupabase(), 0);
    },

    setDailyGoal: (goal: number) => {
        const state = get();
        set({
            dailyGoal: goal,
            dailyProgress: Math.min(state.todayReviewed / goal, 1),
        });
        setTimeout(() => get().syncToSupabase(), 0);
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
        setTimeout(() => get().syncToSupabase(), 0);
    },
}));
