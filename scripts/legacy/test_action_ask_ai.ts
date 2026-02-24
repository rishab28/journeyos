import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { askLiveAI } from './src/app/actions/askAI';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runAskAITest() {
    console.log('🧪 Testing askAI Server Action (Gemini + Supabase)...');

    try {
        // 1. Get a live card to ask a question about
        const { data: cards, error: fetchError } = await supabaseAdmin
            .from('cards')
            .select('*')
            .eq('status', 'live')
            .limit(1);

        if (fetchError || !cards || cards.length === 0) {
            console.error('❌ Could not find a live card to test.');
            return;
        }

        const testCard = cards[0];
        console.log(`Using Card: ${testCard.front}`);

        // 2. We can't easily mock the auth() function inside the Server Action from this pure node script.
        // Wait, `auth()` relies on Next/Headers. If we call `askLiveAI` from node, it will throw:
        // "TypeError: Cannot read properties of undefined (reading 'headers')" or similar Clerk error.

        console.log(`⚠️ Note: askLiveAI uses auth() which won't work outside Next.js request context if it's strict.`);

        // Let's try it anyway. If it fails, we will write a pure logic test by extracting the prompt.
        const res = await askLiveAI(testCard.id, "Explain this to me like I am 5 years old.");

        if (res.error) {
            console.log(`❌ FAIL: ${res.error}`);
        } else {
            console.log(`✅ PASS: AI answered successfully! Context used.`);
            console.log(`Answer: ${res.answer}`);
            console.log(`Credits Remaining: ${res.creditsRemaining}`);
        }

    } catch (e) {
        console.error('❌ Action failed:', e);
    }
}

runAskAITest();
