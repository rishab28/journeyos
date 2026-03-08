const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
if (!supabaseKeyMatch) supabaseKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const supabaseKey = supabaseKeyMatch[1].replace(/['"]/g, '').trim();

const req = https.request({
    hostname: '104.18.38.10',
    port: 443,
    path: '/rest/v1/oracle_chronologies?select=year',
    method: 'GET',
    headers: {
        'Host': 'ybccaumqdesgxywzxdly.supabase.co',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    },
    servername: 'ybccaumqdesgxywzxdly.supabase.co'
}, (res) => {
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
        try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            console.log(`Found ${body.length} rows.`);
            if (body.length > 0) {
                console.log("Rows exist:", body.map(r => r.year).join(', '));
            } else {
                console.log("Table is perfectly empty!");
            }
        } catch (e) {
            console.log("Parse Error:", e);
        }
    });
});

req.on('error', console.error);
req.end();
