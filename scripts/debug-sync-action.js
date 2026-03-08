const { scrapeAndSyncStories } = require('../src/app/actions/admin/stories');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function debugSync() {
    console.log('--- STARTING MANUAL SYNC DEBUG ---');
    try {
        const result = await scrapeAndSyncStories();
        console.log('Sync Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Fatal Sync Error:', e);
    }
}

debugSync();
