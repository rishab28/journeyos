'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Source Management Actions
// Fetching PDFs and aggregating generated flashcard counts
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export interface PdfSource {
    id: string; // The filename in the storage bucket
    name: string;
    size: number;
    created_at: string;
    cardCount: number;
    folder?: string;
    domain?: string;
    subject?: string;
    displayName?: string;
    isProcessed?: boolean;
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
        const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');

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

        // 4. Fetch additional metadata from public.source_metadata
        const { data: metaRows } = await supabase
            .from('source_metadata')
            .select('*');

        const metaMap: Record<string, any> = {};
        if (metaRows) {
            metaRows.forEach(row => {
                metaMap[row.filename] = row;
            });
        }

        // 5. Map the data together
        const mappedData: PdfSource[] = validFiles.map(file => {
            const meta = metaMap[file.name] || {};
            return {
                id: file.name,
                name: file.name,
                size: file.metadata?.size || 0,
                created_at: file.created_at,
                cardCount: sourceCounts[file.name] || 0,
                folder: meta.folder_name || 'Uncategorized',
                domain: meta.domain || 'GS',
                subject: meta.subject || '',
                displayName: meta.display_name || file.name,
                isProcessed: meta.is_processed || false
            };
        });

        return { success: true, data: mappedData };

    } catch (err: any) {
        console.error('[fetchPdfSources] Exception:', err);
        return { success: false, error: err.message || 'Failed to fetch sources.' };
    }
}

export async function updateSourceMetadata(
    filename: string,
    updates: { folder_name?: string, display_name?: string, subject?: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();

        const { error } = await supabase
            .from('source_metadata')
            .upsert({
                filename,
                ...updates,
                updated_at: new Date().toISOString()
            }, { onConflict: 'filename' });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('[updateSourceMetadata] Error:', err);
        return { success: false, error: err.message };
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

export async function registerSource(
    filename: string,
    metadata: { display_name: string; domain: string; subject: string; folder_name?: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase
            .from('source_metadata')
            .upsert({
                filename,
                ...metadata,
                is_processed: false,
                updated_at: new Date().toISOString()
            }, { onConflict: 'filename' });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('[registerSource] Error:', err);
        return { success: false, error: err.message };
    }
}

export async function markSourceProcessed(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase
            .from('source_metadata')
            .update({ is_processed: true, updated_at: new Date().toISOString() })
            .eq('filename', filename);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('[markSourceProcessed] Error:', err);
        return { success: false, error: err.message };
    }
}
