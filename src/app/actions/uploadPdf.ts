'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Sources Action
// Handles uploading raw PDF files to Supabase Storage (Bypasses RLS)
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

export async function uploadPdfToStorage(formData: FormData): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
        const file = formData.get('file') as File;

        if (!file) {
            return { success: false, error: 'No file provided.' };
        }

        // Force Service Role Key to bypass RLS for Admin Uploads
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false }
        });

        // Clean filename and append timestamp to prevent collisions
        const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filename = `${Date.now()}_${cleanName}`;

        const arrayBuffer = await file.arrayBuffer();

        const { error } = await supabase.storage
            .from('pdfs')
            .upload(filename, arrayBuffer, {
                cacheControl: '3600',
                contentType: 'application/pdf',
                upsert: true
            });

        if (error) {
            console.error('[uploadPdf] Storage error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, filename };

    } catch (err: any) {
        console.error('[uploadPdf] Exception:', err);
        return { success: false, error: err.message || 'Failed to upload PDF.' };
    }
}
