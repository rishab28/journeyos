'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Sources Action
// Handles uploading raw PDF files to Supabase Storage (Bypasses RLS)
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export async function uploadPdfToStorage(formData: FormData): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, error: 'No file provided.' };

        // This now uses the global DNS bypass fallback with SNI support!
        const supabase = await createServerSupabaseClient();

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

        if (error) throw error;
        return { success: true, filename };

    } catch (err: any) {
        console.error('[uploadPdf] Exception:', err);
        return { success: false, error: err.message || 'Failed to upload PDF.' };
    }
}

export async function getPdfDownloadUrl(filename: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.storage
            .from('pdfs')
            .createSignedUrl(filename, 3600); // 1 hour expiration

        if (error) throw error;
        return { success: true, url: data.signedUrl };
    } catch (err: any) {
        console.error('[getPdfDownloadUrl] Error:', err);
        return { success: false, error: err.message };
    }
}

export async function extractPdfTextServer(filename: string): Promise<{ success: boolean; text?: string; pageCount?: number; error?: string }> {
    try {
        // Essential Polyfill for pdfjs-dist in Node.js environment
        if (typeof global.DOMMatrix === 'undefined') {
            (global as any).DOMMatrix = class DOMMatrix {
                constructor() { }
                static fromFloat32Array() { return new DOMMatrix(); }
                static fromFloat64Array() { return new DOMMatrix(); }
            };
        }

        const supabase = await createServerSupabaseClient();

        // 1. Download file from storage
        const { data, error } = await supabase.storage
            .from('pdfs')
            .download(filename);

        if (error) throw error;

        // 2. Parse PDF on the server using pdf-parse v2
        const buffer = Buffer.from(await data.arrayBuffer());

        // Dynamic import to avoid bundling issues — pdf-parse v2 uses ESM
        const pdfParseModule = await import('pdf-parse');
        // Handle both ES module and CJS default exports
        const PDFParse = pdfParseModule.PDFParse || (pdfParseModule as any).default?.PDFParse;

        if (!PDFParse) {
            throw new Error('PDFParse class not found in pdf-parse module');
        }

        const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });

        // pdf-parse v2: getText() handles loading internally, returns TextResult with .text
        const textResult = await pdfParser.getText();

        // Return a fresh, clean object to avoid any proxy/serialization issues
        return {
            success: true,
            text: textResult.text ? String(textResult.text) : '',
            pageCount: Number(textResult.total || 0)
        };

    } catch (err: any) {
        console.error('[extractPdfTextServer] Fatal Exception:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMessage };
    }
}
