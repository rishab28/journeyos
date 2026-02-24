// ═══════════════════════════════════════════════════════════
// JourneyOS — Pattern Miner (Anticipatory Intelligence)
// Analyzes global peer data and historical exam frequencies to 
// assign Lethality Scores and predict Confusion Hotspots.
// ═══════════════════════════════════════════════════════════

import { Difficulty, Subject } from '@/types';

export interface LethalityMetric {
    topic: string;
    score: number; // 0-100 (Probability of devastating a candidate's rank)
    frequencyPast10Years: number; // How many times it appeared
    averagePeerAccuracy: number; // Global accuracy on this topic (e.g., 45%)
    isConfusionHotspot: boolean; // True if average accuracy is < 50% yet frequency is high
}

class PatternMiner {
    // Mock database of global topic metrics (In a real app, this comes from an aggregation table)
    private globalMetrics: Record<string, LethalityMetric> = {
        'Fundamental Rights': { topic: 'Fundamental Rights', score: 95, frequencyPast10Years: 18, averagePeerAccuracy: 65, isConfusionHotspot: false },
        'Directive Principles': { topic: 'Directive Principles', score: 88, frequencyPast10Years: 12, averagePeerAccuracy: 42, isConfusionHotspot: true },
        'Land Reforms': { topic: 'Land Reforms', score: 92, frequencyPast10Years: 14, averagePeerAccuracy: 35, isConfusionHotspot: true },
        'Monetary Policy': { topic: 'Monetary Policy', score: 98, frequencyPast10Years: 22, averagePeerAccuracy: 48, isConfusionHotspot: true },
        'Ocean Currents': { topic: 'Ocean Currents', score: 75, frequencyPast10Years: 8, averagePeerAccuracy: 55, isConfusionHotspot: false },
    };

    /**
     * Calculates the Lethality Score of a given topic.
     * High Frequency + Low Global Accuracy = High Lethality.
     */
    public calculateLethality(topic: string, fallbackDifficulty: Difficulty): number {
        const metric = this.globalMetrics[topic];

        if (metric) {
            return metric.score;
        }

        // Fallback heuristic based on difficulty if offline/not mapped
        switch (fallbackDifficulty) {
            case Difficulty.HARD:
                return 85;
            case Difficulty.MEDIUM:
                return 60;
            case Difficulty.EASY:
                return 30;
            default:
                return 50;
        }
    }

    /**
     * Determines if a topic is a global Confusion Hotspot.
     * If true, the system should proactively trigger 'Clarification Mode' 
     * before the user fails the card.
     */
    public isConfusionHotspot(topic: string): boolean {
        const metric = this.globalMetrics[topic];
        if (metric) {
            return metric.isConfusionHotspot;
        }
        return false;
    }

    /**
     * Re-calibrates the study queue based on a dynamic exam pivot.
     * E.g., if news breaks about a new Supreme Court ruling, the engine
     * retroactively boosts the lethality of related topics.
     */
    public applyExamPivot(currentTopicWeights: Record<string, number>, pivotedTopic: string): Record<string, number> {
        const newWeights = { ...currentTopicWeights };
        if (newWeights[pivotedTopic] !== undefined) {
            // Boost weightage significantly due to trend shift
            newWeights[pivotedTopic] = Math.min(newWeights[pivotedTopic] * 1.5, 100);
        }
        return newWeights;
    }

    /**
     * Generates a preemptive "First Principles" prompt or clarification 
     * based on the confusion hotspot status.
     */
    public getPreemptiveClarification(topic: string): string | null {
        if (this.isConfusionHotspot(topic)) {
            return `WARNING: 65% of candidates fail on '${topic}'. Let's derive it from First Principles before you proceed.`;
        }
        return null;
    }
}

export const patternMiner = new PatternMiner();
