const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
if (!supabaseKeyMatch) supabaseKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const supabaseKey = supabaseKeyMatch[1].replace(/['"]/g, '').trim();

const SUPABASE_HOSTNAME = 'ybccaumqdesgxywzxdly.supabase.co';
const SUPABASE_IP = '104.18.38.10';

const payload = JSON.stringify({
    year: 2008,
    subject: "GS",
    content: "test payload content...",
    questions: [{ "topic": "test", "content": "test question" }]
});

const req = https.request({
    hostname: SUPABASE_IP,
    port: 443,
    path: '/rest/v1/oracle_raw_papers?on_conflict=year,subject',
    method: 'POST', // UPSERT requires POST with specific headers in REST API
    headers: {
        'Host': SUPABASE_HOSTNAME,
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(payload)
    },
    servername: SUPABASE_HOSTNAME
}, (res) => {
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", Buffer.concat(chunks).toString());
    });
});

req.on('error', console.error);
req.write(payload);
req.end();
