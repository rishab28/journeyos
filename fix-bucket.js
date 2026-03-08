const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixBucket() {
    try {
        console.log('Fetching bucket info...');
        const { data: bucket, error } = await supabase.storage.getBucket('pdfs');
        if (error) {
            console.error('Error fetching bucket:', error);
            return;
        }
        console.log('Bucket Info:', JSON.stringify(bucket, null, 2));

        console.log('\nUpdating bucket settings for large files and CORS...');
        const { data: updateData, error: updateError } = await supabase.storage.updateBucket('pdfs', {
            public: true,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: 52428800 // 50MB
        });

        if (updateError) {
            console.error('Error updating bucket:', updateError);
            return;
        }
        console.log('Bucket updated successfully!', updateData);

    } catch (e) {
        console.error('Exception:', e);
    }
}

checkAndFixBucket();
