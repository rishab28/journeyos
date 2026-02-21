// ═══════════════════════════════════════════════════════════
// JourneyOS — Progress Store ("Needle State")
// Tracks accuracy, streaks, daily goals, and rank probability
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { Subject, type SubjectStat, type UserProgress } from '@/types';

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
    // Weighted formula:
    // 50% accuracy + 30% volume factor + 20% streak factor
    const volumeFactor = Math.min(totalReviewed / 100, 1) * 100; // caps at 100 cards
    const streakFactor = Math.min(currentStreak / 20, 1) * 100;  // caps at 20 streak

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

    // Personalization
    setUPSC_IQ: (iq: number) => void;
    setInterestProfile: (profile: string) => void;

    // Actions
    recordAnswer: (subject: Subject, isCorrect: boolean) => void;
    setDailyGoal: (goal: number) => void;
    reset: () => void;
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
    upscIQ: 0, // 0 indicates not onboarded yet
    interestProfile: 'Geopolitics', // Default

    // Daily goal
    dailyGoal: 20,
    todayReviewed: 0,
    dailyProgress: 0,

    setUPSC_IQ: (iq) => set({ upscIQ: iq }),
    setInterestProfile: (profile) => set({ interestProfile: profile }),

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
    },

    setDailyGoal: (goal: number) => {
        const state = get();
        set({
            dailyGoal: goal,
            dailyProgress: Math.min(state.todayReviewed / goal, 1),
        });
    },

    reset: () =>
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
        }),
}));
