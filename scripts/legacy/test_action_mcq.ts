import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { generateMCQ } from './src/app/actions/generateMCQ';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runMCQTest() {
    console.log('🧪 Testing generateMCQ Server Action (Gemini + Supabase)...');

    try {
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

        const res = await generateMCQ(testCard.id, testCard.front, testCard.back);

        if (res.error) {
            console.log(`❌ FAIL: ${res.error}`);
        } else {
            console.log(`✅ PASS: MCQ generated! Credits left: ${res.creditsRemaining}`);
            console.log(`Options:`, res.options);
        }

    } catch (e) {
        console.error('❌ Action failed:', e);
    }
}

runMCQTest();
