'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Source Management Actions
// Fetching PDFs and aggregating generated flashcard counts
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface PdfSource {
    id: string; // The filename in the storage bucket
    name: string;
    size: number;
    created_at: string;
    cardCount: number;
}

export async function fetchPdfSources(): Promise<{ success: boolean; data?: PdfSource[]; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Fetch all files from the 'pdfs' bucket
        const { data: files, error: storageError } = await supabase.storage
            .from('pdfs')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (storageError) {
            console.error('[fetchPdfSources] Storage error:', storageError);
            return { success: false, error: storageError.message };
        }

        // Filter out any hidden system files (like .emptyFolderPlaceholder)
        const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder' && f.metadata);

        if (validFiles.length === 0) {
            return { success: true, data: [] };
        }

        // 2. Fetch all cards to aggregate counts by source_pdf
        const { data: cards, error: dbError } = await supabase
            .from('cards')
            .select('source_pdf');

        if (dbError) {
            console.error('[fetchPdfSources] DB error:', dbError);
            return { success: false, error: dbError.message };
        }

        // 3. Count occurrences
        const sourceCounts: Record<string, number> = {};
        if (cards) {
            for (const c of cards) {
                if (c.source_pdf) {
                    sourceCounts[c.source_pdf] = (sourceCounts[c.source_pdf] || 0) + 1;
                }
            }
        }

        // 4. Map the data together
        const mappedData: PdfSource[] = validFiles.map(file => ({
            id: file.name,
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            cardCount: sourceCounts[file.name] || 0
        }));

        return { success: true, data: mappedData };

    } catch (err: any) {
        console.error('[fetchPdfSources] Exception:', err);
        return { success: false, error: err.message || 'Failed to fetch sources.' };
    }
}

export async function deleteSourceCascade(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Delete all cards where source_pdf = filename
        const { error: dbError } = await supabase
            .from('cards')
            .delete()
            .eq('source_pdf', filename);

        if (dbError) {
            console.error('[deleteSourceCascade] DB delete error:', dbError);
            return { success: false, error: `Failed to delete cards: ${dbError.message}` };
        }

        // 2. Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('pdfs')
            .remove([filename]);

        if (storageError) {
            console.error('[deleteSourceCascade] Storage delete error:', storageError);
            return { success: false, error: `Cards deleted, but failed to delete PDF file: ${storageError.message}` };
        }

        return { success: true };

    } catch (err: any) {
        console.error('[deleteSourceCascade] Exception:', err);
        return { success: false, error: err.message || 'Failed to completely delete source.' };
    }
}
