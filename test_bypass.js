const { createClient } = require('@supabase/supabase-js');
const { Agent } = require('undici');
const dns = require('dns');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_HOSTNAME = 'ybccaumqdesgxywzxdly.supabase.co';
const SUPABASE_IP = '104.18.38.10';

const agent = new Agent({
    connect: {
        lookup: (hostname, options, callback) => {
            if (hostname === SUPABASE_HOSTNAME) {
                console.log(`[DNS Bypass] Forcing ${hostname} to ${SUPABASE_IP}`);
                return callback(null, [{ address: SUPABASE_IP, family: 4 }]);
            }
            return dns.lookup(hostname, options, callback);
        }
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: (url, options) => fetch(url, { ...options, dispatcher: agent })
    }
});

async function test() {
    console.log("Testing connection to Supabase via DNS Bypass...");
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("FAIL:", error.message);
    } else {
        console.log("SUCCESS! Buckets found:", data.map(b => b.name));
    }
}

test();
