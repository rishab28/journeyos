const https = require('https');

const RSS_FEEDS = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss' },
    { name: 'Indian Express', url: 'https://indianexpress.com/feed/' }
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
    for (const feed of RSS_FEEDS) {
        console.log(`Testing ${feed.name}...`);
        const xml = await get(feed.url);
        
        const itemRegex = /<item>([\\s\\S]*?)<\\/item>/g;
        let match;
        let count = 0;
        while ((match = itemRegex.exec(xml)) !== null && count < 5) {
            const itemContent = match[1];
            const title = extractTag(itemContent, 'title');
            const link = extractTag(itemContent, 'link');
            console.log(`  - ${title} (${link})`);
            count++;
        }
        console.log(`Found ${count} items in ${feed.name}\n`);
    }
}

test();
