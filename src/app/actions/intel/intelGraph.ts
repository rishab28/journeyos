'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Intelligence Graph Engine (Causal Auto-Linking)
// Foundational logic for "Product of the Century" Graphing
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { generateEmbedding } from '@/lib/core/ai/gemini';

/**
 * findAndLinkConnections
 * Scans the vault for semantically similar nodes and creates 'causal' links.
 */
export async function autoLinkIntelligence(nodeId: string) {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Get the target node
        const { data: node, error: nodeError } = await supabase
            .from('intelligence_vault')
            .select('*')
            .eq('id', nodeId)
            .single();

        if (nodeError || !node) throw new Error('Node not found');

        // 2. Perform vector search for similar nodes (threshold 0.85)
        // Note: Using the match_vault_content function defined in migration 017
        const { data: matches, error: matchError } = await supabase.rpc('match_vault_content', {
            query_embedding: node.embedding,
            match_threshold: 0.85,
            match_count: 5
        });

        if (matchError) throw matchError;

        const connections = [];

        // 3. Create connections for matches (excluding self)
        for (const match of matches) {
            if (match.id === nodeId) continue;

            const { data: conn, error: connError } = await supabase
                .from('intelligence_connections')
                .upsert({
                    source_id: nodeId,
                    target_id: match.id,
                    connection_type: 'causal',
                    strength: match.similarity,
                    logic_explanation: `High semantic similarity (${Math.round(match.similarity * 100)}%) detected between ${node.source_name} and ${match.source_name}.`
                })
                .select()
                .single();

            if (!connError) connections.push(conn);
        }

        return {
            success: true,
            connectionCount: connections.length,
            message: `Auto-linked ${connections.length} nodes to ${node.source_name}`
        };

    } catch (error) {
        console.error('[IntelGraph] Auto-link error:', error);
        return { success: false, error: 'Failed to auto-link intelligence' };
    }
}

/**
 * getConnectedIntel
 * Fetches the local graph for a specific node
 */
export async function getConnectedIntel(nodeId: string) {
    try {
        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase.rpc('get_intel_connections', {
            start_id: nodeId
        });

        if (error) throw error;

        return { success: true, graph: data };

    } catch (error) {
        console.error('[IntelGraph] Fetch error:', error);
        return { success: false, error: 'Failed to fetch intelligence graph' };
    }
}
