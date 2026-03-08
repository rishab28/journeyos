import { scrapeAndSyncStories } from '../src/app/actions/admin/stories';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    console.log('--- FORCING NEWS SYNC (DIRECT ACTION) ---');
    try {
        const result = await scrapeAndSyncStories();
        console.log('SYNC COMPLETED');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('SYNC FATAL ERROR:', err);
    }
}

run();
