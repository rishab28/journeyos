const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Checking RLS for source_metadata...");
    const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'source_metadata' });
    // If RPC doesn't exist, we can use a direct query to pg_policies if we had direct access, 
    // but usually we don't. Let's just try to insert a dummy row.
    
    console.log("Attempting test insert into source_metadata...");
    const { data, error: iError } = await supabase
        .from('source_metadata')
        .upsert({
            filename: 'test_rls_probe.pdf',
            display_name: 'RLS Probe',
            domain: 'GS',
            subject: 'Polity',
            is_processed: false
        }, { onConflict: 'filename' });
    
    if (iError) {
        console.error("INSERT ERROR:", iError);
    } else {
        console.log("INSERT SUCCESS:", data);
    }
}
test();
