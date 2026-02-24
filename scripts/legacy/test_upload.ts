import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('Testing upload to pdfs bucket with Anon Key...');
  
  const { data, error } = await supabase.storage.from('pdfs').upload('test_anon.txt', 'test content anon', { upsert: true });
  
  if (error) {
    console.error('Anon Upload Failed:', error.message);
  } else {
    console.log('Anon Upload Succeeded!', data);
  }
}

testUpload();
