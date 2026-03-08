import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumn() {
    console.log("Checking cards schema...");

    // Many Supabase setups restrict direct SQL execution. Let's try to query the REST /rpc to see if there's an arbitrary query runner
    // First let's check what exactly is missing
    const { error } = await supabase.from('cards').select('elimination_trick').limit(1);
    if (error && error.message.includes('does not exist')) {
        console.log("Column 'elimination_trick' is confirmed missing.");
        console.log("\n⚠️ ACTION REQUIRED: You must run this SQL snippet in the Supabase Dashboard SQL Editor:");
        console.log(`
--------------------------------------------------
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS elimination_trick text;
CREATE INDEX IF NOT EXISTS idx_cards_elimination_trick ON public.cards(elimination_trick) WHERE elimination_trick IS NOT NULL;
--------------------------------------------------
`);
    } else {
        console.log("Column exists now!");
    }
}

addMissingColumn();
