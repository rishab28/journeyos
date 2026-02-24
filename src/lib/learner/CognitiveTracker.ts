// ═══════════════════════════════════════════════════════════
// JourneyOS — Cognitive Performance Engine
// Tracks hesitation mapping and pseudo-knowledge tagging.
// ═══════════════════════════════════════════════════════════

export interface CognitiveMetrics {
    hesitationTimeMs: number;
    isPseudoKnowledge: boolean;
    speedGapMs?: number; // Gap vs Rank 1 Toppers
}

/**
 * Global Rank 1 Benchmarks (simulated).
 * Average time (ms) a Rank 1 holder takes to process a card type.
 */
export const TOPPER_SPEED_BENCHMARKS = {
    FOUNDATION: 3500,  // 3.5 seconds
    INTERMEDIATE: 5500, // 5.5 seconds
    ADVANCED: 8000     // 8.0 seconds
};

export class CognitiveTracker {
    private cardStartTime: number = 0;

    /**
     * Start the timer when a card is shown to the user.
     */
    startCardTimer() {
        this.cardStartTime = Date.now();
    }

    /**
     * Evaluate the cognitive load upon flipping the card.
     * @param scaffoldLevel The complexity level of the card
     * @param userResponse The quality of the recall (1-5 scale, generally 4+ is 'Pass')
     * @returns CognitiveMetrics
     */
    evaluateHesitation(scaffoldLevel: 'Foundation' | 'Intermediate' | 'Advanced' = 'Intermediate', userResponse: number): CognitiveMetrics {
        if (this.cardStartTime === 0) {
            return { hesitationTimeMs: 0, isPseudoKnowledge: false };
        }

        const endTime = Date.now();
        const hesitationTimeMs = endTime - this.cardStartTime;

        // Reset timer
        this.cardStartTime = 0;

        // Baseline acceptable time based on complexity
        let baselineMs = TOPPER_SPEED_BENCHMARKS.INTERMEDIATE;
        if (scaffoldLevel === 'Foundation') baselineMs = TOPPER_SPEED_BENCHMARKS.FOUNDATION;
        if (scaffoldLevel === 'Advanced') baselineMs = TOPPER_SPEED_BENCHMARKS.ADVANCED;

        // "Pseudo-Knowledge" Definition:
        // The user got it right (Score 4 or 5) but hesitated significantly longer than the baseline (+3 seconds).
        // This indicates they had to "dig deep" rather than possessing "fluent recall".
        const isPseudoKnowledge = userResponse >= 4 && (hesitationTimeMs > baselineMs + 3000);

        // Speed Gap
        const speedGapMs = Math.max(0, hesitationTimeMs - baselineMs);

        // In a real production system, this data would be dispatched to a backend telemetry stream.
        console.log(`[Cognitive Tracker] Hesitation: ${hesitationTimeMs}ms (Baseline: ${baselineMs}ms). PseudoKnowledge: ${isPseudoKnowledge}`);

        return {
            hesitationTimeMs,
            isPseudoKnowledge,
            speedGapMs
        };
    }
}

// Singleton export
export const cognitiveEngine = new CognitiveTracker();
