const dns = require('node:dns');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// MONKEY PATCH DNS
const originalLookup = dns.lookup;
dns.lookup = function (hostname, ...args) {
    const callback = args[args.length - 1];
    if (hostname === 'ybccaumqdesgxywzxdly.supabase.co') {
        console.log(`[DNS BYPASS] Intercepted lookup for ${hostname} -> forcing 104.18.38.10`);
        return callback(null, '104.18.38.10', 4);
    }
    return originalLookup.apply(dns, args);
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing connection with DNS monkey-patch...");
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error("FAIL:", error.message);
        } else {
            console.log("SUCCESS! Buckets found:", data.map(b => b.name));
        }
    } catch (e) {
        console.error("EXCEPTION:", e.message);
    }
}

test();
