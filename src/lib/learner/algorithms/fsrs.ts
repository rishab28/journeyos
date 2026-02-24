import { ReviewQuality, SRSData } from '@/types';

// ─── FSRS Algorithm (Experimental Neural Core 2.0) ──────────
// Free Spaced Repetition Scheduler principles: Stability & Retrievability

export interface FSRSData extends SRSData {
    stability: number;      // Days until recall probability is 90%
    difficulty: number;     // 1.0 (Easy) to 10.0 (Hard)
    retrievability?: number; // Estimated probability of recall today
    lethality_adjustment?: number; // 0.7 to 1.0 (Dampening factor)
}

export function calculateFSRS(
    quality: ReviewQuality,
    currentSRS: FSRSData,
    certaintyScore: number = 3,
    upscIQ: number = 50,
    isPseudoKnowledge: boolean = false,
    targetExamDate?: string,
    lethalityWeight: number = 1.0 // Phase 15: Adaptive Learning Weight
): FSRSData {
    let { stability, difficulty, repetitions } = currentSRS;

    // 1. Update Difficulty based on performance
    const qualityDiff = 4 - (quality);
    difficulty = Math.max(1, Math.min(10, difficulty + (qualityDiff * 0.5)));

    // 2. Update Stability (The core of FSRS)
    if (quality >= ReviewQuality.CORRECT_DIFFICULT) {
        // Multipliers
        const recallFactor = quality === 5 ? 2.5 : quality === 4 ? 1.8 : 1.3;
        const iqBonus = 1 + (upscIQ / 400);
        const pseudoPenalty = isPseudoKnowledge ? 0.7 : 1.0;
        const certaintyMultiplier = 0.8 + (certaintyScore * 0.1);

        // Apply Lethality Dampening (Sprint 15)
        // High lethality (weight > 1) reduces stability growth, forcing more reviews.
        const lethalityDampening = Math.max(0.7, 1 / lethalityWeight);

        if (repetitions === 0) {
            stability = (quality === 5 ? 4 : 2) * lethalityDampening;
        } else {
            stability = stability * recallFactor * iqBonus * pseudoPenalty * certaintyMultiplier * lethalityDampening;
        }
        repetitions += 1;
    } else {
        // Failure: Stability drops significantly
        stability = Math.max(0.2, stability * 0.2);
        repetitions = 0;
    }

    let interval = Math.max(1, Math.round(stability));

    // Phase 16: Temporal Compression Constraint
    if (targetExamDate) {
        const nowMs = Date.now();
        const examDateMs = new Date(targetExamDate).getTime();
        const daysUntilExam = Math.max(1, Math.ceil((examDateMs - nowMs) / (1000 * 60 * 60 * 24)));

        if (interval > daysUntilExam) {
            interval = Math.max(1, Math.floor(daysUntilExam * 0.8));
        }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    return {
        easeFactor: 2.5,
        interval: interval,
        repetitions: repetitions,
        nextReviewDate: nextDate.toISOString(),
        lastReviewDate: new Date().toISOString(),
        stability: Math.round(stability * 100) / 100,
        difficulty: Math.round(difficulty * 100) / 100,
        lethality_adjustment: Math.round(Math.max(0.7, 1 / lethalityWeight) * 100) / 100
    };
}
