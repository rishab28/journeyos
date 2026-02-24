
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
    console.log('--- Supabase Comprehensive Diagnostic ---');
    console.log('Target URL:', supabaseUrl);
    console.log('Using Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');

    // 1. Check Buckets
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
        console.error('Error listing buckets:', bError.message);
    } else {
        console.log('Visible buckets:', buckets.map(b => b.name));
    }

    // 2. Try to list files in 'pdfs' bucket directly even if not listed in listBuckets
    console.log("Checking 'pdfs' bucket directly...");
    const { data: files, error: fError } = await supabase.storage.from('pdfs').list();
    if (fError) {
        console.error("Direct 'pdfs' access error:", fError.message);
    } else {
        console.log(`- Success! Files found: ${files.length}`);
        files.forEach(f => console.log(`  - ${f.name}`));
    }

    // 3. Check source_metadata structure and content
    const { data: meta, error: mError } = await supabase.from('source_metadata').select('*');
    if (mError) {
        console.error('Error fetching source_metadata:', mError.message);
    } else {
        console.log(`- Success! Rows in source_metadata: ${meta.length}`);
        meta.forEach(r => console.log(`  - ${r.filename} (Processed: ${r.is_processed})`));
    }

    // 4. Check profiles for Admin status
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Error fetching profiles:', pError.message);
    } else {
        console.log(`- Profiles registered: ${profiles.length}`);
        profiles.forEach(p => console.log(`  - ${p.email || p.user_id} | Admin: ${p.is_admin}`));
    }
}

testStorage();
