import { createServerSupabaseClient } from './src/lib/core/supabase/server';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const sb = createServerSupabaseClient();
    console.log("Checking oracle_raw_papers...");
    const { data, error } = await sb.from('oracle_raw_papers').select('year, subject').order('year');
    if (error) console.error("Error:", error);
    else console.log(`Found ${data.length} records in oracle_raw_papers`);
}
check();
