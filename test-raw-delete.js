const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
if (!supabaseKeyMatch) supabaseKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const supabaseKey = supabaseKeyMatch[1].replace(/['"]/g, '').trim();

const SUPABASE_HOSTNAME = 'ybccaumqdesgxywzxdly.supabase.co';
const SUPABASE_IP = '104.18.38.10';

const req = https.request({
    hostname: SUPABASE_IP,
    port: 443,
    path: '/rest/v1/oracle_chronologies?year=neq.0',
    method: 'DELETE',
    headers: {
        'Host': SUPABASE_HOSTNAME,
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    servername: SUPABASE_HOSTNAME
}, (res) => {
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        try {
            const bodyStr = Buffer.concat(chunks).toString();
            console.log("Response Body:", bodyStr);
        } catch (e) {
            console.log("Parse Error:", e);
        }
    });
});

req.on('error', console.error);
req.end();
