// ═══════════════════════════════════════════════════════════
// JourneyOS — Supabase Server Client
// For use in Server Components, Server Actions, Route Handlers
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { dnsProofFetch } from './dnsBypass';

export function createServerSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn(
            '⚠️ Supabase credentials missing for server client.'
        );
    }

    return createClient(supabaseUrl ?? '', supabaseServiceKey ?? '', {
        global: {
            fetch: (url, options) => dnsProofFetch(url as string, options as any)
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
