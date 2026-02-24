import { scrapeAndSyncStories } from './src/app/actions/stories';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testEngine() {
    console.log('🚀 Starting Stories Engine Test...');

    // Simulate the 4-hour sync
    const result = await scrapeAndSyncStories();

    if (result.success) {
        console.log(`✅ Success! Saved ${result.count} new stories.`);
    } else {
        console.error('❌ Failed:', result.error);
    }
}

testEngine().catch(console.error);
