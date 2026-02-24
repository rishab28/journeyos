// test_embedding.ts
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { generateEmbedding } from './src/lib/ai/gemini';

async function testEmbedding() {
    console.log('🧪 Testing Gemini Embedding Generation...');
    try {
        const result = await generateEmbedding('What are the primary objectives of the Right to Information Act?');
        console.log(`✅ Success! Embedding length: ${result.length}`);
        console.log(`First 3 values:`, result.slice(0, 3));
    } catch (e) {
        console.error('❌ Failed:', e);
    }
}

testEmbedding();
