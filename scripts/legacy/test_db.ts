// test_db.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey; // Fallback to anon for reading

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey as string);

async function runTests() {
    console.log('🧪 Testing Supabase Connection & RLS...\n');

    // Test 1: Public Cards Read Access (RLS Check)
    console.log('--- Test 1: Reading Live Cards ---');
    const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('id, status')
        .eq('status', 'live')
        .limit(5);

    if (cardsError) {
        console.error('❌ Failed to read cards:', cardsError.message);
    } else {
        console.log(`✅ Successfully read ${cards.length} live cards.`);
        if (cards.length > 0) {
            console.log('   Sample card status:', cards[0].status);
        } else {
            console.log('   ⚠️ No live cards found in the database. (This might be expected if empty)');
        }
    }

    // Test 2: Profiles Read Access
    console.log('\n--- Test 2: Reading Profiles ---');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, ai_credits')
        .limit(5);

    if (profilesError) {
        console.error('❌ Failed to read profiles:', profilesError.message);
    } else {
        console.log(`✅ Successfully read ${profiles.length} profiles.`);
        if (profiles.length > 0) {
            console.log('   Sample profile credits:', profiles[0].ai_credits);
        } else {
            console.log('   ⚠️ No profiles found in the database. (Expected if no users have engaged AI yet)');
        }
    }

    console.log('\n✅ Supabase tests completed.');
}

runTests();
