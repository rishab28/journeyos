// ═══════════════════════════════════════════════════════════
// JourneyOS — Mental Stamina Optimizer
// Tracks performance decay and calculates readiness logic.
// ═══════════════════════════════════════════════════════════

export interface SessionStamina {
    msi: number; // Mental Stamina Index (0-100)
    cardsReviewedThisSession: number;
    consecutiveFails: number;
    readinessScore: number; // Overall readiness per subject
}

export class StaminaOptimizer {
    private msi: number = 100; // Starts at 100% capacity
    private sessionCards: number = 0;
    private consecutiveFails: number = 0;

    // Config
    private readonly MSI_DROP_PER_CARD = 0.5; // Base drain
    private readonly MSI_DROP_PER_FAIL = 3.0; // High drain
    private readonly MSI_RESTORE_PER_EASY = 1.0; // Dopamine hit

    /**
     * Resets the stamina for a new study session.
     */
    resetSession() {
        this.msi = 100;
        this.sessionCards = 0;
        this.consecutiveFails = 0;
    }

    /**
     * Log a card review event to drain/restore mental stamina.
     */
    processReviewEvent(quality: number, isPseudoKnowledge: boolean) {
        this.sessionCards++;

        if (quality < 3) {
            // Failed recall
            this.consecutiveFails++;
            this.msi -= this.MSI_DROP_PER_FAIL;
        } else if (quality === 5 && !isPseudoKnowledge) {
            // Fluent recall restores some stamina (Flow state)
            this.consecutiveFails = 0;
            this.msi += this.MSI_RESTORE_PER_EASY;
        } else {
            // Standard decay (Pass, but took effort, or Pseudo-knowledge)
            this.consecutiveFails = 0;
            this.msi -= (this.MSI_DROP_PER_CARD + (isPseudoKnowledge ? 1.0 : 0));
        }

        // Clamp MSI between 0 and 100
        this.msi = Math.max(0, Math.min(100, this.msi));

        console.log(`[Stamina Optimizer] MSI: ${this.msi.toFixed(1)}% | Session Cards: ${this.sessionCards} | Consecutive Fails: ${this.consecutiveFails}`);
    }

    /**
     * Determines the optimal type of card to serve next.
     * Prevents burnout by recognizing low MSI.
     */
    recommendNextCardType(): 'NORMAL' | 'MNEMONIC_ONLY' | 'CONCEPTUAL_DRILL' | 'BREAK_RECOMMENDED' {
        if (this.msi < 20) {
            return 'BREAK_RECOMMENDED';
        }

        if (this.consecutiveFails >= 3 || this.msi < 40) {
            // Too much cognitive strain, switch to easy dopamine hooks
            return 'MNEMONIC_ONLY';
        }

        return 'NORMAL';
    }

    /**
     * Calculates the "Readiness Score" for a specific subject.
     * Combines historical accuracy, recent hesitation data, and review volume.
     */
    calculateSubjectReadiness(
        historicalAccuracy: number, // 0-100
        averageSpeedGapMs: number, // 0-10000+
        cardsMasteredCount: number
    ): number {
        // Readiness formula weighting
        // Accuracy: 50%
        // Speed/Fluency vs Rank 1: 30%
        // Volume (Experience): 20%

        const accuracyScore = historicalAccuracy * 0.5;

        // Convert average speed gap (e.g. 5000ms delay) into a penalty rating
        // No gap = 30 points. 10 second gap = 0 points.
        const speedScore = Math.max(0, 30 * (1 - (averageSpeedGapMs / 10000)));

        // Logarithmic volume score. 100 masteries gives ~20 points.
        const volumeScore = Math.min(20, (Math.log10(cardsMasteredCount + 1) / 2) * 20);

        const readiness = accuracyScore + speedScore + volumeScore;

        return Math.min(100, Math.round(readiness));
    }

    getCurrentStamina(): SessionStamina {
        return {
            msi: this.msi,
            cardsReviewedThisSession: this.sessionCards,
            consecutiveFails: this.consecutiveFails,
            readinessScore: 0 // Computed dynamically per subject
        };
    }
}

// Singleton export
export const staminaEngine = new StaminaOptimizer();
