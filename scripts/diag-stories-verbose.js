const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diag() {
  try {
    const now = new Date().toISOString();
    console.log('--- DIAGNOSTIC START ---');
    console.log('Current Time (UTC):', now);
    console.log('Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // 1. Check Table Structure / Existence
    const { data: cols, error: colErr } = await supabase.from('daily_stories').select('*').limit(1);
    if (colErr) {
        console.error('Error selecting from daily_stories:', colErr);
        return;
    }
    console.log('Successfully connected to daily_stories table.');

    // 2. Counts
    const { count: totalCount, error: countErr } = await supabase.from('daily_stories').select('*', { count: 'exact', head: true });
    console.log('Total rows in daily_stories:', totalCount);

    // 3. Expiration Check
    const { data: expired, count: expiredCount } = await supabase.from('daily_stories').select('id', { count: 'exact', head: true }).lt('expires_at', now);
    console.log('Rows already expired (expires_at < now):', expiredCount);

    const { data: active, count: activeCount } = await supabase.from('daily_stories').select('id', { count: 'exact', head: true }).gt('expires_at', now);
    console.log('Rows active (expires_at > now):', activeCount);

    // 4. Sample Active Items
    const { data: items } = await supabase.from('daily_stories')
        .select('title, created_at, expires_at')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('\n--- TOP 10 RECENT ENTRIES ---');
    if (items && items.length > 0) {
        items.forEach((item, i) => {
            const isExpired = new Date(item.expires_at) < new Date(now);
            console.log(`[${i+1}] ${item.title}`);
            console.log(`    Created: ${item.created_at}`);
            console.log(`    Expires: ${item.expires_at} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`);
        });
    } else {
        console.log('No entries found.');
    }

    console.log('--- DIAGNOSTIC END ---');
  } catch (e) {
    console.error('Fatal Diag Error:', e);
  }
}

diag();
