import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

async function testDB() {
  const supabase = createClient(supabaseUrl, serviceKey);
  
  console.log("Testing raw DB insert with service key to bypass RLS...");
  // Let's see if we can just query the cards table
  const { data, error } = await supabase.from('cards').select('id').limit(1);
  if (error) {
    console.error("DB Query error:", error.message);
  } else {
    console.log("DB Query success. Data:", data);
  }
}

testDB();
