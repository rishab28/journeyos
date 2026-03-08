const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
let supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
if (!supabaseKeyMatch) supabaseKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const supabaseKey = supabaseKeyMatch[1].replace(/['"]/g, '').trim();

const SUPABASE_HOSTNAME = 'ybccaumqdesgxywzxdly.supabase.co';
const SUPABASE_IP = '104.18.38.10';

const req = https.request({
    hostname: SUPABASE_IP,
    port: 443,
    path: '/rest/v1/oracle_raw_papers?select=year,subject',
    method: 'GET',
    headers: {
        'Host': SUPABASE_HOSTNAME,
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    },
    servername: SUPABASE_HOSTNAME
}, (res) => {
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
        try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            console.log(`Found ${body.length} rows.`);
            body.forEach(row => {
                console.log(`Year: ${row.year}, Subject: ${row.subject}`);
            });
        } catch (e) {
            console.log("Parse Error:", Buffer.concat(chunks).toString());
        }
    });
});

req.on('error', console.error);
req.end();
