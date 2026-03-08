import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { oracleAI } from './client';
import { CardType, Difficulty, Domain, Subject, CardStatus } from '@/types';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Nexus: Synthesis Service
// Lethal Card Fabrication & Vault Gap Detection.
// ═══════════════════════════════════════════════════════════

export interface SynthesisResult {
    success: boolean;
    newCardsCreated: number;
}

export class OracleSynthesis {
    private readonly SYSTEM_PROMPT = `
        You are the JourneyOS 'Lethal Synthesis Engine'. Generate high-quality MCQs and Flashcards based on Oracle predictions for 2026.
        RULES: 
        1. 3+ statements for MCQs. 
        2. Logic Traps required. 
        3. Use 'Topper Tone' (Conversational, WITTY).
        4. Include 'eliminationTrick' and 'trendEvolution'.
    `;

    async runSynthesis(): Promise<SynthesisResult> {
        const supabase = createServerSupabaseClient();
        console.log('[OracleSynthesis] Auditing Vault for content gaps...');

        // 1. Get latest shadow matrix
        const { data: chronList } = await supabase
            .from('oracle_chronologies')
            .select('*')
            .order('year', { ascending: false })
            .limit(1);

        const latestChron = chronList?.[0];

        if (!latestChron || !latestChron.shadow_matrix) {
            throw new Error('No Shadow Matrix found. Evolution must be run first.');
        }

        let newCardsCreated = 0;

        // 2. Map & Synthesize
        for (const item of latestChron.shadow_matrix) {
            const theme = item.target_hierarchy || item.theme;
            if (!theme) continue;

            // Semantic density check
            const embedding = await oracleAI.embed(theme);
            const { data: matches } = await supabase.rpc('match_cards', {
                query_embedding: embedding,
                match_threshold: 0.85,
                match_count: 2
            });

            if (!matches || matches.length < 2) {
                console.log(`[OracleSynthesis] Gap Detected: ${theme}. Synthesizing lethal content...`);

                const prompt = `
                    THEME: ${theme}
                    LETHALITY: ${item.lethality_score}%
                    THE CATCH: ${item.the_catch_warning}
                    Generate 3 high-lethality cards (2 MCQs, 1 Flashcard).
                `;

                const response = await oracleAI.generate({
                    prompt,
                    systemInstruction: this.SYSTEM_PROMPT,
                    jsonMode: true
                });

                const cards = JSON.parse(response);
                if (Array.isArray(cards)) {
                    for (const card of cards) {
                        const { error } = await supabase.from('cards').insert({
                            ...this.mapCard(card, theme, item.lethality_score),
                            user_id: '00000000-0000-0000-0000-000000000000', // System user
                            updated_at: new Date().toISOString()
                        });
                        if (!error) newCardsCreated++;
                    }
                }
            }
        }

        return { success: true, newCardsCreated };
    }

    private mapCard(card: any, theme: string, lethality: number) {
        return {
            type: card.type || 'MCQ',
            subject: card.subject || Subject.POLITY,
            topic: card.topic || theme,
            sub_topic: card.sub_topic || card.subTopic,
            difficulty: card.difficulty || Difficulty.HARD,
            front: card.front,
            back: card.back,
            explanation: card.explanation,
            topper_trick: card.topper_trick || card.topperTrick,
            elimination_trick: card.elimination_trick || card.eliminationTrick,
            options: card.options,
            domain: Domain.GS,
            status: CardStatus.LIVE,
            oracle_confidence: lethality || 95,
            priority_score: 10,
            trend_evolution: card.trend_evolution || `Synthesized via Oracle Nexus for 2026.`
        };
    }
}

export const oracleSynthesis = new OracleSynthesis();
