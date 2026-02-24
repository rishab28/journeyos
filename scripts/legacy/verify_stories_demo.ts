import { getActiveStories } from './src/app/actions/getStories';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyDemo() {
    console.log('🧪 Verifying Stories Demo Fallback...');
    const result = await getActiveStories();

    if (result.success) {
        console.log(`✅ Success! Found ${result.stories.length} stories.`);
        result.stories.forEach((s, i) => {
            console.log(`[${i}] ${s.subject}: ${s.title} (ID: ${s.id})`);
        });

        const isDemo = result.stories.some(s => s.id.startsWith('demo-'));
        if (isDemo) {
            console.log('✨ Demo fallback is ACTIVE.');
        } else {
            console.log('🗄️ Real DB stories are ACTIVE.');
        }
    } else {
        console.error('❌ Failed:', result.error);
    }
}

verifyDemo().catch(console.error);
