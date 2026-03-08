'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Autonomous Pattern Propagation Engine (Nuclear)
// Scales Oracle insights across the entire Vault via RAG
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import * as https from 'https';

interface PropagationResult {
    success: boolean;
    message: string;
    affectedCards?: number;
    error?: string;
}

/**
 * Nuclear Embedding Generator (DNS-Proof)
 */
async function generateEmbeddingNuclear(text: string): Promise<number[]> {
    const rawKeys = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
    const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    const apiKey = apiKeys[0];

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.embedding?.values) {
                        resolve(json.embedding.values);
                    } else {
                        reject(new Error(`Embedding failed: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

/**
 * Propagates Oracle patterns from the latest chronology to all related cards.
 */
export async function propagateOraclePatterns(): Promise<PropagationResult> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Fetch the latest Oracle Chronology (Year 2025/2026 predictions)
        const { data: chronList, error: chronError } = await supabase
            .from('oracle_chronologies')
            .select('*')
            .order('year', { ascending: false })
            .limit(1);

        const latestChron = chronList?.[0];

        if (chronError || !latestChron) {
            return { success: false, message: 'No Oracle chronology found to propagate.', error: chronError?.message };
        }

        // Themes come from the shadow_matrix (predictions for the future)
        const shadowMatrix = latestChron.shadow_matrix || [];
        if (shadowMatrix.length === 0) {
            return { success: false, message: 'Latest chronology has no shadow matrix (predictions).' };
        }

        console.log(`[Propagation] Initiating ripple for ${shadowMatrix.length} lethal themes...`);
        let totalAffected = 0;

        // 2. For each theme in the shadow matrix, perform a vector search and update related cards
        for (const item of shadowMatrix) {
            const theme = item.target_hierarchy || item.theme;
            if (!theme) continue;

            console.log(`[Propagation] Processing lethal theme: ${theme}`);
            const themeEmbedding = await generateEmbeddingNuclear(theme);

            // Fetch matching cards using vector similarity
            const { data: matches, error: matchError } = await supabase.rpc('match_cards', {
                query_embedding: themeEmbedding,
                match_threshold: 0.75, // Lower threshold slightly for broader impact
                match_count: 50
            });

            if (matchError) {
                console.error(`[Propagation] Match error for theme "${theme}":`, matchError);
                continue;
            }

            if (!matches || matches.length === 0) {
                console.log(`[Propagation] No matches for theme "${theme}". Synthesis will handle this.`);
                continue;
            }

            const cardIds = matches.map((m: any) => m.id);

            // 3. Bulk update highly relevant cards
            const { count, error: updateError } = await supabase
                .from('cards')
                .update({
                    oracle_confidence: Math.max(90, item.lethality_score || 90),
                    trend_evolution: `Oracle Prediction [Year ${latestChron.year + 1}]: High-lethality pattern detected. Reasoning: ${latestChron.reasoning_summary || 'Pattern evolution shift'}.`,
                    priority_score: 10, // Extreme priority for predicted content
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
            pattern_accuracy: latestChron.accuracy_score || 85,
            causal_density: shadowMatrix.length,
            node_coverage: Math.min(100, (totalAffected / 1000) * 100),
            reasoning_shift: `Nuclear Propagation cycle completed for Year ${latestChron.year + 1}. Affected ${totalAffected} nodes.`,
            logic_snapshot: latestChron.learned_logic_weights
        });

        return {
            success: true,
            message: `Neural Ripple Complete. Oracle predictions for ${latestChron.year + 1} successfully propagated to ${totalAffected} nodes.`,
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
