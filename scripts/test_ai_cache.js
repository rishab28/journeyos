// ═══════════════════════════════════════════════════════════
// JourneyOS — AI Cache Verification Script
// Run with: node scripts/test_ai_cache.js
// ═══════════════════════════════════════════════════════════

const { neuralGateway } = require('../src/lib/core/ai/neuralGateway');
require('dotenv').config({ path: '.env.local' });

async function verifyCache() {
    console.log('🚀 Starting AI Cache Verification...');

    const testRequest = {
        model: 'gemini-2.0-flash',
        userPrompt: 'What is the capital of France? Answer in one word.',
        systemPrompt: 'You are a helpful assistant.',
        bypassCache: false
    };

    // Test 1: First Call (Should be a Miss)
    console.log('\n--- Test 1: Initial Call (Expecting Cache Miss) ---');
    const start1 = Date.now();
    const res1 = await neuralGateway.generateContent(testRequest);
    const end1 = Date.now();
    console.log(`Response: ${res1.text}`);
    console.log(`Time taken: ${end1 - start1}ms`);
    console.log(`Cached: ${res1.cached ? 'YES' : 'NO'}`);

    // Test 2: Second Call (Should be a Hit - Exact Hash)
    console.log('\n--- Test 2: Repeat Call (Expecting Exact Hash Hit) ---');
    const start2 = Date.now();
    const res2 = await neuralGateway.generateContent(testRequest);
    const end2 = Date.now();
    console.log(`Response: ${res2.text}`);
    console.log(`Time taken: ${end2 - start2}ms`);
    console.log(`Cached: ${res2.cached ? 'YES' : 'NO'}`);

    if (res2.cached) {
        console.log('✅ SUCCESS: Exact match caching works!');
    } else {
        console.log('❌ FAILURE: Exact match caching did not trigger.');
    }

    // Test 3: Semantic Call (Should be a Hit - Similarity)
    console.log('\n--- Test 3: Similar Call (Expecting Semantic Hit) ---');
    const semanticRequest = {
        ...testRequest,
        userPrompt: 'Tell me the capital of France in just one word.' // Slightly different wording
    };
    const start3 = Date.now();
    const res3 = await neuralGateway.generateContent(semanticRequest);
    const end3 = Date.now();
    console.log(`Response: ${res3.text}`);
    console.log(`Time taken: ${end3 - start3}ms`);
    console.log(`Cached: ${res3.cached ? 'YES' : 'NO'}`);
    console.log(`Model Used: ${res3.modelUsed}`);

    if (res3.cached && res3.modelUsed === 'semantic-cache') {
        console.log('✅ SUCCESS: Semantic caching works!');
    } else {
        console.log('⚠️ NOTE: Semantic caching might need a longer prompt or lower threshold to trigger in this small test.');
    }
}

verifyCache().catch(console.error);
