// test_logic_srs.ts

export enum ReviewQuality {
    BLACKOUT = 0,
    INCORRECT = 1,
    INCORRECT_EASY = 2,
    CORRECT_DIFFICULT = 3,
    CORRECT_HESITATION = 4,
    PERFECT = 5,
}

export interface SRSData {
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: string;
}

// ─── Direct copy of calculateSM2 from srsStore.ts ───
export function calculateSM2(
    quality: ReviewQuality,
    currentSRS: SRSData,
    certaintyScore?: number,
    upscIQ?: number,
    scaffoldLevel?: string,
    isPseudoKnowledge: boolean = false
): SRSData {
    let { easeFactor, interval, repetitions } = currentSRS;
    const now = new Date();

    if (quality >= 3) {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    } else {
        repetitions = 0;
        interval = 1; // Fallback for 0-2 (Hard failure)
    }

    // Standard SM2 EF adjustment
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    let penaltyMultiplier = 1.0;
    if (quality >= 3 && isPseudoKnowledge) {
        penaltyMultiplier = 0.85;
    }

    if (certaintyScore !== undefined && certaintyScore < 3 && quality >= 3) {
        penaltyMultiplier = Math.min(penaltyMultiplier, 0.90);
    }

    if (upscIQ !== undefined && upscIQ < 50 && quality < 3) {
        easeFactor *= 0.95;
    }

    easeFactor *= penaltyMultiplier;
    easeFactor = Math.max(1.3, easeFactor);

    const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();

    return { easeFactor, interval, repetitions, nextReviewDate };
}


function runSRSTests() {
    console.log('🧪 Testing SM2 Algorithm Logic (Pure Functions)...\n');

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

    const initialSRS: SRSData = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString()
    };

    // Test 1: First perfect review (Quality 5)
    console.log('--- Test 1: First Perfect Review ---');
    const res1 = calculateSM2(ReviewQuality.PERFECT, initialSRS);
    assert(res1.interval === 1, 'Interval should be 1 day for first correct review');
    assert(res1.repetitions === 1, 'Repetitions should be 1');
    assert(res1.easeFactor === 2.6, `Ease Factor should exactly be 2.6 (was ${res1.easeFactor})`);

    // Test 2: Second correct review (Quality 4 - Hesitation)
    console.log('\n--- Test 2: Second Review (Quality 4) ---');
    const res2 = calculateSM2(ReviewQuality.CORRECT_HESITATION, res1);
    assert(res2.interval === 6, 'Interval should be 6 days for second correct review');
    assert(res2.repetitions === 2, 'Repetitions should be 2');
    assert(res2.easeFactor < 2.6, `Ease Factor should decrease slightly due to hesitation (was ${res2.easeFactor})`);

    // Test 3: Failed review (Quality 2 - Incorrect Easy)
    console.log('\n--- Test 3: Failed Review (Quality 2) ---');
    const res3 = calculateSM2(ReviewQuality.INCORRECT_EASY, res2);
    assert(res3.interval === 1, 'Interval should reset to 1 day for failure');
    assert(res3.repetitions === 0, 'Repetitions should reset to 0');
    assert(res3.easeFactor < res2.easeFactor, `Ease Factor should decrease significantly (was ${res3.easeFactor})`);

    // Test 4: Pseudo-knowledge Penalty
    console.log('\n--- Test 4: Pseudo-Knowledge Penalty ---');
    const res4 = calculateSM2(ReviewQuality.PERFECT, initialSRS, undefined, undefined, undefined, true);
    assert(res4.easeFactor < 2.6, `Ease factor should be penalized (0.85x) for pseudo-knowledge (was ${res4.easeFactor})`);

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runSRSTests();
