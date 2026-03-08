const https = require('https');

const RSS_FEEDS = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss' },
    { name: 'Indian Express', url: 'https://indianexpress.com/feed/' },
    { name: 'PIB News', url: 'https://pib.gov.in/RssMain.aspx' },
    { name: 'PRS India', url: 'https://prsindia.org/rss.xml' },
    { name: 'LiveMint Economy', url: 'https://www.livemint.com/rss/economy' }
];

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
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

async function test() {
    console.log('--- RSS FEED DIAGNOSTIC ---');
    console.log('Current Local Date:', new Date().toString());
    
    for (const feed of RSS_FEEDS) {
        try {
            process.stdout.write(`Fetching ${feed.name}... `);
            const xml = await get(feed.url);
            console.log('OK');
            
            const itemRegex = /<item>([\\s\\S]*?)<\\/item>/g;
            let match;
            let count = 0;
            while ((match = itemRegex.exec(xml)) !== null && count < 3) {
                const itemContent = match[1];
                const title = extractTag(itemContent, 'title');
                const pubDate = extractTag(itemContent, 'pubDate');
                console.log(`  - [${pubDate || 'No Date'}] ${title}`);
                count++;
            }
            if (count === 0) console.log('  No <item> tags found.');
        } catch (e) {
            console.log(`FAILED: ${e.message}`);
        }
    }
}

test();
