const dns = require('node:dns');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// FORCE GOOGLE DNS FOR THIS PROCESS
dns.setServers(['8.8.8.8', '8.8.4.4']);
console.log("[DNS] Forced process to use Google DNS:", dns.getServers());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing connection with dns.setServers...");
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error("FAIL:", error.message);
            // Fallback: try to resolve manually
            dns.lookup('ybccaumqdesgxywzxdly.supabase.co', (err, addr) => {
                console.log("DNS Lookup for Supabase says:", addr);
            });
        } else {
            console.log("SUCCESS! Buckets found:", data.map(b => b.name));
        }
    } catch (e) {
        console.error("EXCEPTION:", e.message);
    }
}

test();
