const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RSS_FEEDS = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss' },
    { name: 'Indian Express', url: 'https://indianexpress.com/feed/' },
    { name: 'PIB News', url: 'https://pib.gov.in/RssMain.aspx' },
    { name: 'PRS India', url: 'https://prsindia.org/rss.xml' },
    { name: 'LiveMint Economy', url: 'https://www.livemint.com/rss/economy' }
];

function get(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.abort();
            reject(new Error('Timeout'));
        });
    });
}

function extractTag(content, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = content.match(regex);
    if (!match) return '';
    return match[1]
        .replace(/<!\[CDATA\[([\\s\\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]*>?/gm, '')
        .trim();
}

async function run() {
    console.log('--- FULL SYNC DIAGNOSTIC ---');
    console.log('Target Time:', new Date().toISOString());

    // 1. RSS Check
    const allItems = [];
    for (const feed of RSS_FEEDS) {
        try {
            process.stdout.write(`Fetching ${feed.name}... `);
            const xml = await get(feed.url);
            console.log('OK');
            
            const itemRegex = /<item>([\\s\\S]*?)<\\/item>/g;
            let match;
            let count = 0;
            while ((match = itemRegex.exec(xml)) !== null && count < 5) {
                const itemContent = match[1];
                const title = extractTag(itemContent, 'title');
                const pubDate = extractTag(itemContent, 'pubDate');
                const link = extractTag(itemContent, 'link');
                allItems.push({ title, pubDate, source: feed.name, link });
                count++;
            }
        } catch (e) {
            console.log(`FAILED: ${e.message}`);
        }
    }

    console.log(`Total RSS items fetched (top 5 each): ${allItems.length}`);
    if (allItems.length > 0) {
        console.log('Most Recent RSS Item:', allItems[0].title, '|', allItems[0].pubDate);
    }

    // 2. DB Deduplication Check
    console.log('\n--- DEDUPLICATION STATUS (Last 48h) ---');
    const { data: recent, error: dbErr } = await supabase
        .from('daily_stories')
        .select('title, created_at')
        .gt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

    if (dbErr) {
        console.error('DB Fetch Error:', dbErr.message);
    } else {
        console.log(`Existing stories in last 48h: ${recent.length}`);
        recent.slice(0, 3).forEach(s => console.log(` - [${s.created_at}] ${s.title}`));
    }

    // 3. System Config Check (For Autosync)
    console.log('\n--- SYSTEM CONFIG (Cron Requirements) ---');
    const { data: configTable, error: tableErr } = await supabase.from('system_configs').select('*').limit(1);
    if (tableErr) {
        console.log('CRITICAL: system_configs table is MISSING. Autosync cron will fail.');
    } else {
        console.log('system_configs table exists.');
        const { data: appUrl } = await supabase.from('system_configs').select('value').eq('key', 'app_url').maybeSingle();
        console.log('app_url set to:', appUrl ? appUrl.value : 'NOT SET');
    }
}

run();
