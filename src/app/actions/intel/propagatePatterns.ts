'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Autonomous Pattern Propagation Engine
// Scales Oracle insights across the entire Vault via RAG
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { generateEmbedding } from '@/lib/core/ai/gemini';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';

interface PropagationResult {
    success: boolean;
    message: string;
    affectedCards?: number;
    error?: string;
}

/**
 * Propagates Oracle patterns from the latest calibration to all related cards.
 */
export async function propagateOraclePatterns(): Promise<PropagationResult> {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Fetch the latest Oracle calibration
        const { data: latestCal, error: calError } = await supabase
            .from('oracle_calibrations')
            .select('*')
            .order('year', { ascending: false })
            .limit(1)
            .single();

        if (calError || !latestCal) {
            return { success: false, message: 'No Oracle calibration found to propagate.', error: calError?.message };
        }

        const themes = latestCal.predicted_themes || [];
        if (themes.length === 0) {
            return { success: false, message: 'Latest calibration has no predicted themes.' };
        }

        console.log(`[Propagation] Initiating ripple for ${themes.length} themes...`);
        let totalAffected = 0;

        // 2. For each theme, perform a vector search and update related cards
        for (const theme of themes) {
            console.log(`[Propagation] Processing theme: ${theme}`);
            const themeEmbedding = await generateEmbedding(theme);

            // Fetch matching cards using vector similarity
            // Using RPC 'match_cards' which should exist for RAG
            const { data: matches, error: matchError } = await supabase.rpc('match_cards', {
                query_embedding: themeEmbedding,
                match_threshold: 0.78, // High threshold for precision
                match_count: 50
            });

            if (matchError) {
                console.error(`[Propagation] Match error for theme "${theme}":`, matchError);
                continue;
            }

            if (!matches || matches.length === 0) continue;

            const cardIds = matches.map((m: any) => m.id);

            // 3. Bulk update highly relevant cards
            const { count, error: updateError } = await supabase
                .from('cards')
                .update({
                    oracle_confidence: 90,
                    trend_evolution: `Directly linked to Oracle's ${latestCal.year} high-lethality pattern: "${theme}".`,
                    priority_score: 9, // Elevated priority for sniped content
                    updated_at: new Date().toISOString()
                })
                .in('id', cardIds);

            if (updateError) {
                console.error(`[Propagation] Update error for theme "${theme}":`, updateError);
            } else {
                totalAffected += (count || 0);
                console.log(`[Propagation] Pattern "${theme}" propagated to ${count} cards.`);
            }
        }

        // 4. Update System IQ Telemetry
        await supabase.from('system_iq_evolution').insert({
            pattern_accuracy: latestCal.match_percentage || 85,
            causal_density: themes.length,
            node_coverage: Math.min(100, (totalAffected / 1000) * 100), // Simple heuristic
            reasoning_shift: `Autonomous Propagation cycle completed. Affected ${totalAffected} nodes.`,
            logic_snapshot: latestCal.learned_logic_weights
        });

        return {
            success: true,
            message: `Neural Ripple Complete. Oracle insights successfully propagated to ${totalAffected} intelligence nodes.`,
            affectedCards: totalAffected
        };

    } catch (error: any) {
        console.error('[Propagation] Fatal Error:', error);
        return {
            success: false,
            message: 'Internal Propagation Failure',
            error: error.message
        };
    }
}
