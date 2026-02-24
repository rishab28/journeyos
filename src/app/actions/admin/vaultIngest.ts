'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Intelligence Vault Ingestor (Oracle 2.0)
// Persistent memory for Syllabus, PYQs, and Standard Books
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { generateEmbedding } from '@/lib/core/ai/gemini';

interface VaultMetadata {
    chapter?: string;
    page?: number;
    year?: number;
    topic?: string;
    section?: string;
}

export async function ingestToIntelligenceVault(
    sourceName: string,
    content: string,
    metadata: VaultMetadata = {}
) {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Generate 768-dim embedding
        console.log(`[Vault] Vectorizing ${content.length} chars from ${sourceName}...`);
        const embedding = await generateEmbedding(content);

        // 2. Save to intelligence_vault
        const { data, error } = await supabase
            .from('intelligence_vault')
            .insert({
                source_name: sourceName,
                content,
                embedding,
                metadata
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            id: data.id,
            message: `Successfully ingested into Intelligence Vault: ${sourceName}`
        };

    } catch (error) {
        console.error('Vault Ingest Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
