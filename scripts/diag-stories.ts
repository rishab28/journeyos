import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diag() {
  const now = new Date().toISOString();
  console.log('Current Time (UTC):', now);

  const { data: total } = await supabase.from('daily_stories').select('id', { count: 'exact' });
  console.log('Total stories in daily_stories:', total?.length);

  const { data: active } = await supabase
    .from('daily_stories')
    .select('title, created_at, expires_at')
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  console.log('\nActive Stories (> now):', active?.length);
  active?.slice(0, 5).forEach(s => console.log(` - [${s.created_at}] ${s.title} (Expires: ${s.expires_at})`));

  const { data: recent } = await supabase
    .from('daily_stories')
    .select('title, created_at, expires_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\nLast 5 Stories (Overall):');
  recent?.forEach(s => console.log(` - [${s.created_at}] ${s.title} (Expires: ${s.expires_at})`));
}

diag();
