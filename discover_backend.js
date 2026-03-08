const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const SUPABASE_HOSTNAME = 'ybccaumqdesgxywzxdly.supabase.co';
const SUPABASE_IP = '104.18.38.10';

async function dnsProofFetch(url, init) {
    const urlString = url.toString();
    try {
        return await fetch(urlString, init);
    } catch (err) {
        const urlObj = new URL(urlString);
        if (urlObj.hostname !== SUPABASE_HOSTNAME) throw err;

        const requestHeaders = { 'Host': SUPABASE_HOSTNAME };
        if (init?.headers) {
            if (init.headers instanceof Headers) {
                init.headers.forEach((v, k) => { requestHeaders[k] = v; });
            } else if (Array.isArray(init.headers)) {
                init.headers.forEach(([k, v]) => { requestHeaders[k] = v; });
            } else {
                Object.assign(requestHeaders, init.headers);
            }
        }

        return new Promise((resolve, reject) => {
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
                    resolve(new Response(body, {
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: res.headers
                    }));
                });
            });
            req.on('error', (e) => reject(e));
            if (init?.body) {
                if (typeof init.body === 'string') req.write(init.body);
                else if (Buffer.isBuffer(init.body)) req.write(init.body);
                else req.write(Buffer.from(init.body));
            }
            req.end();
        });
    }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    global: { fetch: dnsProofFetch }
});

async function listAllTables() {
    const commonTables = [
        'profiles', 'cards', 'source_metadata', 'user_sessions',
        'cognitive_telemetry', 'squads', 'squad_members', 'mentors',
        'syllabus', 'topics', 'sub_topics', 'notifications',
        'stories', 'mcqs', 'user_progress', 'vault_nodes',
        'shared_intel', 'shared_intel_comments', 'squad_blindspots',
        'review_history'
    ];

    console.log('--- Backend Discovery ---');
    for (const table of commonTables) {
        try {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                if (error.code === '42P01') {
                    console.log(`Table: ${table} | Status: NOT FOUND`);
                } else {
                    console.log(`Table: ${table} | Status: ERROR | Message: ${error.message} | Code: ${error.code}`);
                }
            } else {
                console.log(`Table: ${table} | Status: EXISTS | Rows: ${count ?? 0}`);
            }
        } catch (e) {
            console.log(`Table: ${table} | Status: EXCEPTION | Message: ${e.message}`);
        }
    }
}

listAllTables();
