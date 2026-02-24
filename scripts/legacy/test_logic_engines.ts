// test_logic_engines.ts
import { StaminaOptimizer, SessionStamina } from './src/lib/StaminaOptimizer';
import { CognitiveTracker, TOPPER_SPEED_BENCHMARKS } from './src/lib/CognitiveTracker';
import { patternMiner } from './src/lib/PatternMiner';
import { Difficulty } from './src/types';

function runEngineTests() {
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

    console.log('🧪 Testing Stamina Engine...\n');
    const staminaEngine = new StaminaOptimizer();

    // Test 1: Initial state
    let state = staminaEngine.getCurrentStamina();
    assert(state.msi === 100, `Initial MSI should be 100 (was ${state.msi})`);

    // Test 2: Flow state (Perfect score)
    staminaEngine.processReviewEvent(5, false);
    state = staminaEngine.getCurrentStamina();
    assert(state.msi === 100, `MSI capped at 100 on perfect recall`); // Starts at 100, goes up +1, claps to 100

    // Test 3: Normal effort decay
    staminaEngine.processReviewEvent(4, false); // -0.5
    state = staminaEngine.getCurrentStamina();
    assert(state.msi === 99.5, `MSI should drop by 0.5 for normal review (was ${state.msi})`);

    // Test 4: Failure decay
    staminaEngine.processReviewEvent(2, false); // -3.0
    state = staminaEngine.getCurrentStamina();
    assert(state.msi === 96.5, `MSI should drop by 3.0 on fail (was ${state.msi})`);
    assert(state.consecutiveFails === 1, `Consecutive fails tracked (was ${state.consecutiveFails})`);

    console.log('\n🧪 Testing Cognitive Tracker...\n');
    const cognitiveEngine = new CognitiveTracker();

    cognitiveEngine.startCardTimer();

    // Simulate waiting 10 seconds
    const start = Date.now();
    while (Date.now() - start < 100) { } // Busy wait 100ms
    // We can't perfectly mock Date.now without overriding it globally, so we will stub the timer internally for a pure test if needed, or just test its logic

    console.log('\n🧪 Testing Pattern Miner...\n');

    let lethality = patternMiner.calculateLethality('Fundamental Rights', Difficulty.MEDIUM);
    assert(lethality === 95, `Lethality from mock data should be 95 (was ${lethality})`);

    let fallbackLethality = patternMiner.calculateLethality('Unknown Topic', Difficulty.HARD);
    assert(fallbackLethality === 85, `Fallback difficulty HARD should yield 85 lethality (was ${fallbackLethality})`);

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runEngineTests();
