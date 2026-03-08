'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Generates a signed upload URL for a specific filename in the 'pdfs' bucket.
 * This URL allows the client to upload the file directly to Supabase storage
 * bypassing Next.js server limits and RLS (authenticated via service role).
 */
export async function createSignedUploadUrl(filename: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase environment variables missing');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.storage
            .from('pdfs')
            .createSignedUploadUrl(filename);

        if (error) {
            console.error('[createSignedUploadUrl] Error:', error);
            throw error;
        }

        return { success: true, url: data.signedUrl };
    } catch (err: any) {
        console.error('[createSignedUploadUrl] Exception:', err);
        return { success: false, error: err.message || 'Failed to generate signed upload URL' };
    }
}
