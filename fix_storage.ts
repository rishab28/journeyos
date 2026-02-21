import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('Connecting to:', supabaseUrl);
  
  // Create bucket if it doesn't exist
  const { data, error } = await supabase.storage.createBucket('pdfs', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf']
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "pdfs" already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket "pdfs" created successfully!');
  }
}

fix();
