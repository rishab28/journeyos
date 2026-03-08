// ═══════════════════════════════════════════════════════════
// JourneyOS — DNS Bypass Utility
// Bypasses ISP/DNS hijacking for Supabase domains
// ═══════════════════════════════════════════════════════════

import https from 'https';

const SUPABASE_HOSTNAME = 'ybccaumqdesgxywzxdly.supabase.co';
const SUPABASE_IP = '104.18.38.10';

export async function dnsProofFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
    const urlString = url.toString();

    try {
        // Try standard fetch first (most robust)
        const response = await fetch(urlString, init);
        return response;
    } catch (err: any) {
        const message = err.message.toLowerCase();
        if (message.includes('fetch failed') || message.includes('etimedout') || message.includes('enotfound')) {
            console.log(`[DNS Bypass] Primary fetch failed. Retrying ${urlString} via IP with SNI Fix...`);

            return new Promise((resolve, reject) => {
                const urlObj = new URL(urlString);
                if (urlObj.hostname !== SUPABASE_HOSTNAME) {
                    return reject(err); // Only bypass Supabase
                }

                // Convert Headers object to plain object for https.request
                const requestHeaders: Record<string, string> = {
                    'Host': SUPABASE_HOSTNAME
                };

                if (init?.headers) {
                    if (typeof (init.headers as any).forEach === 'function') {
                        // Handles native Headers or Next.js polyfilled Headers
                        (init.headers as any).forEach((value: string, key: string) => {
                            requestHeaders[key] = value;
                        });
                    } else if (typeof (init.headers as any).entries === 'function') {
                        for (const [key, value] of (init.headers as any).entries()) {
                            requestHeaders[key] = value;
                        }
                    } else if (Array.isArray(init.headers)) {
                        init.headers.forEach(([key, value]) => {
                            requestHeaders[key] = value;
                        });
                    } else {
                        // Plain object fallback
                        Object.assign(requestHeaders, init.headers);
                    }
                }

                // If this is a DELETE or POST with a body but no content-length, we must calculate it
                // Otherwise Cloudflare or PostgREST might hang waiting for a body that never comes or never ends.
                let bodyBuffer: Buffer | undefined;
                if (init?.body) {
                    if (typeof init.body === 'string') {
                        bodyBuffer = Buffer.from(init.body);
                    } else if (init.body instanceof Buffer) {
                        bodyBuffer = init.body;
                    } else if (init.body instanceof ArrayBuffer) {
                        bodyBuffer = Buffer.from(init.body);
                    }
                }

                if (bodyBuffer) {
                    requestHeaders['Content-Length'] = bodyBuffer.length.toString();
                }

                // Low-level HTTPS request to control SNI (servername)
                const req = https.request({
                    hostname: SUPABASE_IP,
                    port: 443,
                    path: urlObj.pathname + urlObj.search,
                    method: init?.method || 'GET',
                    headers: requestHeaders,
                    servername: SUPABASE_HOSTNAME // CRITICAL: Sets SNI to the domain, not the IP
                }, (res) => {
                    const chunks: any[] = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => {
                        try {
                            const bodyBuffer = Buffer.concat(chunks);
                            // Fetch API specification STRICTLY forbids a body (even an empty Buffer) for 204, 205 and 304 responses.
                            // Passing a body throws an untrapped Exception that causes the Promise to hang forever.
                            const hasNoContent = res.statusCode === 204 || res.statusCode === 205 || res.statusCode === 304;
                            const finalBody = hasNoContent ? null : bodyBuffer;

                            resolve(new Response(finalBody, {
                                status: res.statusCode,
                                statusText: res.statusMessage,
                                headers: res.headers as any
                            }));
                        } catch (err) {
                            reject(err);
                        }
                    });
                });

                req.on('error', (e) => reject(e));

                if (init?.body) {
                    if (typeof init.body === 'string') {
                        req.write(init.body);
                    } else if (init.body instanceof Buffer) {
                        req.write(init.body);
                    } else if (init.body instanceof ArrayBuffer) {
                        req.write(Buffer.from(init.body));
                    } else {
                        // Handle Blobs/Files if necessary, though server actions usually give us buffers/strings
                        console.warn('[DNS Bypass] Body type not fully supported in fallback:', typeof init.body);
                    }
                }

                req.end();
            });
        }
        throw err;
    }
}
