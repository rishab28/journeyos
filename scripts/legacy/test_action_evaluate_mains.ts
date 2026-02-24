import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { evaluateMains } from './src/app/actions/evaluateMains';

async function runMainsTest() {
    console.log('🧪 Testing evaluateMains Server Action (Gemini + Supabase)...');

    try {
        // We'll use a hardcoded question and answer to bypass the need for a live DB card initially, 
        // passing a fake UUID since the action uses it for credit deduction (which will fail if the user doesn't own it)
        // Wait, the evaluateMains action *fetches* the card and the user. 
        // So we need a real card ID from the DB. Let's fetch one like in the MCQ test.

        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

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

        const testAnswer = "The Fundamental Rights are very important because they give power to the people and stop the government from being a dictator. They are justiciable which means we can go to the supreme court if they are violated under article 32.";

        console.log(`Submitting Answer: "${testAnswer}"...`);

        const res = await evaluateMains(testCard.id, testCard.front, testAnswer);

        if (res.error) {
            console.log(`❌ FAIL: ${res.error}`);
        } else {
            console.log(`✅ PASS: Mains Evaluation generated! Credits left: ${res.creditsRemaining}`);
            console.log(`Score:`, res.score);
            console.log(`Keywords Missed:`, res.missing);
            console.log(`Feedback:`, res.feedback);
        }

    } catch (e) {
        console.error('❌ Action failed:', e);
    }
}

runMainsTest();
