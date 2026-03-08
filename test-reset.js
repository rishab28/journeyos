import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';


dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const dnsProofFetch = async (urlStr, init) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(urlStr);
        const SUPABASE_IP = '104.18.38.10';
        const SUPABASE_HOSTNAME = urlObj.hostname;

        const requestHeaders = { 'Host': SUPABASE_HOSTNAME };
        if (init?.headers) {
            if (typeof init.headers.forEach === 'function') {
                init.headers.forEach((value, key) => { requestHeaders[key] = value; });
            } else if (typeof init.headers.entries === 'function') {
                for (const [key, value] of init.headers.entries()) { requestHeaders[key] = value; }
            } else if (Array.isArray(init.headers)) {
                init.headers.forEach(([key, value]) => { requestHeaders[key] = value; });
            } else { Object.assign(requestHeaders, init.headers); }
        }

        let bodyBuffer;
        if (init?.body) {
            if (typeof init.body === 'string') bodyBuffer = Buffer.from(init.body);
        }
        if (bodyBuffer) requestHeaders['Content-Length'] = bodyBuffer.length.toString();

        const req = https.request({
            hostname: SUPABASE_IP,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: init?.method || 'GET',
            headers: requestHeaders,
            servername: SUPABASE_HOSTNAME
        }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks);
                const r = new Response(body, {
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: new Headers(res.headers)
                });
                console.log(`[Fetch Debug] ${init.method} ${urlObj.pathname} -> ${res.statusCode}`);
                resolve(r);
            });
        });

        req.on('error', (e) => reject(e));
        if (bodyBuffer) req.write(bodyBuffer);
        req.end();
    });
};

const supabase = createClient(supabaseUrl, supabaseKey, { global: { fetch: dnsProofFetch } });

async function run() {
    console.log("Fetching latest weights...");
    const { data: latest, error: fetchErr } = await supabase
        .from('oracle_chronologies')
        .select('logic_weights')
        .order('year', { ascending: false })
        .limit(1)
        .single();

    console.log("Weights fetch result:", latest, "Error:", fetchErr?.code || fetchErr);

    console.log("Starting delete...");
    const { data, error } = await supabase.from('oracle_chronologies').delete().neq('year', 0);
    console.log("Delete result:", data, "Error:", error);

    console.log("Starting insert...");
    const { data: iData, error: iErr } = await supabase.from('oracle_chronologies').insert({ year: 1994, logic_weights: latest?.logic_weights });
    console.log("Insert result:", iData, "Error:", iErr);
}
run().then(() => console.log("Done."));
