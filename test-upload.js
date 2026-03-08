const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignedUploadUrl() {
    try {
        const filename = 'test_signed_' + Date.now() + '.txt';
        console.log('Creating signed URL for', filename);

        const { data, error } = await supabase.storage
            .from('pdfs')
            .createSignedUploadUrl(filename);

        if (error) throw error;

        console.log('Signed URL Data:', data);

        fs.writeFileSync('test.txt', 'Hello World!');

        // Try uploading To Signed URL using SDK
        console.log('Uploading using SDK...');
        const fileContent = fs.readFileSync('test.txt');
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .uploadToSignedUrl(data.path, data.token, fileContent);

        if (uploadError) {
            console.error('SDK Upload Error:', uploadError);
        } else {
            console.log('SDK Upload Success:', uploadData);
        }
    } catch (e) {
        console.error(e);
    }
}

testSignedUploadUrl();
