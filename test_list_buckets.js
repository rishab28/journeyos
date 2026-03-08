const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    console.log("BUCKETS:", JSON.stringify(buckets, null, 2));
    if (bError) console.error("BUCKET ERROR:", bError);

    const { data: files, error: fError } = await supabase.storage.from('pdfs').list();
    console.log("FILES IN PDFS:", JSON.stringify(files, null, 2));
    if (fError) console.error("FILE ERROR:", fError);
}
test();
