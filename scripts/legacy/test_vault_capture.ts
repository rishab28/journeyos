import { saveStoryToVault } from './src/app/actions/stories';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testVaultCapture() {
    console.log('🚀 Testing 1-Tap Vault Capture...');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get a story ID
    const { data: stories } = await supabase.from('daily_stories').select('id').limit(1);

    if (!stories || stories.length === 0) {
        console.error('❌ No stories found to test capture.');
        return;
    }

    const storyId = stories[0].id;
    console.log(`Using Story ID: ${storyId}`);

    // 2. Capture to vault
    const result = await saveStoryToVault(storyId);

    if (result.success) {
        console.log('✅ Success! Story converted to Flashcard.');
    } else {
        console.error('❌ Capture failed:', result.error);
    }
}

testVaultCapture().catch(console.error);
