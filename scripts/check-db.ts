import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
    console.log("Applying DB fix...");

    // We cannot use rpc to execute arbitrary DDL easily unless an admin function exists.
    // Instead, let's just create a dummy card to see if it actually fails on insert 
    // or if the schema cache just needs a refresh.

    // Let's try to reload the schema cache first by calling a simple query.
    const { data, error } = await supabase.from('cards').select('id, elimination_trick').limit(1);
    if (error) {
        console.error("Column missing error confirmed:", error.message);
    } else {
        console.log("Column exists. Data:", data);
    }
}

applyFix();
