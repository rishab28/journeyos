import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('Testing raw buffer upload...');
  const buffer = Buffer.from('hello world pdf simulation');
  
  const { data, error } = await supabase.storage
    .from('pdfs')
    .upload('buffer_test.pdf', buffer, { 
      contentType: 'application/pdf',
      upsert: true 
    });
    
  if (error) {
    console.error('Buffer Upload Failed:', error.message);
  } else {
    console.log('Buffer Upload Succeeded!', data);
  }
}

testUpload();
