const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.storage.from('pdfs').createSignedUploadUrl('test_file.pdf');
    console.log("SIGNED URL DATA:", data, "ERROR:", error);
    
    // Test uploading to this signed URL
    if (data && data.signedUrl) {
       const fs = require('fs');
       const token = data.token;
       const url = data.signedUrl;
       
       console.log("Trying to upload using fetch...");
       
       const fileBuffer = fs.readFileSync('test_ingest.pdf');
       const blob = new Blob([fileBuffer], { type: 'application/pdf' });
       const formData = new FormData();
       formData.append('cacheControl', '3600');
       formData.append('', blob);
       
       try {
           const res = await fetch(url, {
               method: 'PUT',
               headers: {
                 'x-upsert': 'true'
               },
               body: formData
           });
           
           const text = await res.text();
           console.log("Upload response status:", res.status);
           console.log("Upload response text:", text);
       } catch(e) {
           console.error("Fetch failed:", e);
       }
    }
}
test();
