// test_logic_progress.ts
import { Subject, SubjectStat } from './src/types';

export function initSubjectStats(): Record<Subject, SubjectStat> {
    const stats = {} as Record<Subject, SubjectStat>;
    for (const subject of Object.values(Subject)) {
        stats[subject] = { total: 0, correct: 0, accuracy: 0 };
    }
    return stats;
}

export function calculateRankProbability(
    accuracy: number,
    totalReviewed: number,
    currentStreak: number
): number {
    if (totalReviewed < 50) return Math.min(accuracy * 0.5, 30);

    const accuracyWeight = (accuracy / 100) * 60; // Up to 60 points

    // Logarithmic volume weight (maxes around 5000 cards)
    const volumeScore = Math.min(30, (Math.log10(totalReviewed) / Math.log10(5000)) * 30);

    // Streak bonus
    const streakBonus = Math.min(10, currentStreak * 0.5);

    const rawProb = accuracyWeight + volumeScore + streakBonus;

    return Math.min(99.9, Math.max(1.0, rawProb));
}


function runProgressTests() {
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, desc: string) => {
        if (condition) {
            console.log(`✅ PASS: ${desc}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${desc}`);
            failed++;
        }
    };

    console.log('🧪 Testing Progress Logic...\n');

    const stats = initSubjectStats();
    assert(Object.keys(stats).length > 5, 'Stats should cover multiple subjects');
    // We ignore the type error here for testing since we know Polity is a valid runtime key due to enum values
    // @ts-ignore
    assert(stats['Polity'].total === 0, 'Initial total should be 0');

    console.log('\n🧪 Testing Rank Probability Formula...\n');
    let prob1 = calculateRankProbability(90, 5000, 20); // 90% accuracy, 5000 cards, 20 streak
    // Expected: (90/100)*60 = 54. volume = 30. streak = 10. Total = 94.
    assert(prob1 >= 90, `Prob with high accuracy and high volume should be very high (was ${prob1})`);

    let prob2 = calculateRankProbability(50, 10, 1);
    // Expected: < 50 cards -> Math.min(50 * 0.5, 30) = 25
    assert(prob2 === 25, `Prob with < 50 cards is capped (was ${prob2})`);

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runProgressTests();
