import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const dnsProofFetch = async (urlStr, options) => {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const SUPABASE_DB_IP = '104.18.38.10';

        const requestHeaders = { 'Host': url.hostname };

        if (options?.headers) {
            if (typeof options.headers.forEach === 'function') {
                options.headers.forEach((value, key) => { requestHeaders[key] = value; });
            } else if (typeof options.headers.entries === 'function') {
                for (const [key, value] of options.headers.entries()) { requestHeaders[key] = value; }
            } else if (Array.isArray(options.headers)) {
                options.headers.forEach(([key, value]) => { requestHeaders[key] = value; });
            } else { Object.assign(requestHeaders, options.headers); }
        }

        let bodyBuffer;
        if (options?.body) {
            if (typeof options.body === 'string') bodyBuffer = Buffer.from(options.body);
            else if (options.body instanceof Buffer) bodyBuffer = options.body;
            else if (options.body instanceof ArrayBuffer) bodyBuffer = Buffer.from(options.body);
        }

        if (bodyBuffer) requestHeaders['Content-Length'] = bodyBuffer.length.toString();

        const reqOptions = {
            hostname: SUPABASE_DB_IP, port: 443,
            path: url.pathname + url.search, method: options.method || 'GET',
            headers: requestHeaders, servername: url.hostname, rejectUnauthorized: false
        };

        const req = https.request(reqOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode, statusText: res.statusMessage, headers: res.headers,
                    json: async () => JSON.parse(body), text: async () => body
                });
            });
        });

        req.on('error', reject);
        if (bodyBuffer) req.write(bodyBuffer);
        req.end();
    });
};

const supabase = createClient(supabaseUrl, supabaseKey, { global: { fetch: dnsProofFetch } });

async function checkRows() {
    const { data, error } = await supabase.from('oracle_chronologies').select('year');
    console.log("Error:", error);
    console.log("Rows Count:", data?.length);
    console.log("Years:", data?.map(d => d.year));
}
checkRows();
