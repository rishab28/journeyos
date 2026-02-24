'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Ask AI Server Action (Credit-Safe Live Chat)
// 5 credits/day, resets daily, card-context-aware answers
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { PROMPTS } from '@/lib/core/ai/prompts';
import { generateEmbedding } from '@/lib/core/ai/gemini';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// ─── Get or Create User Profile ─────────────────────────────

async function getOrCreateProfile(supabase: ReturnType<typeof createServerSupabaseClient>) {
    // Check for existing profile
    const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .single();

    if (existing) {
        // Check if credits need daily reset
        const lastReset = new Date(existing.last_credit_reset);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        if (hoursSinceReset >= 24) {
            // Reset credits
            const { data: updated } = await supabase
                .from('profiles')
                .update({ ai_credits: 5, last_credit_reset: now.toISOString() })
                .eq('user_id', DEFAULT_USER_ID)
                .select()
                .single();
            return updated || existing;
        }

        return existing;
    }

    // Create new profile
    const { data: created } = await supabase
        .from('profiles')
        .insert({ user_id: DEFAULT_USER_ID, ai_credits: 5 })
        .select()
        .single();

    return created;
}

// ─── Get Credits ────────────────────────────────────────────

export async function getCredits(): Promise<{ credits: number; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();
        const profile = await getOrCreateProfile(supabase);
        return { credits: profile?.ai_credits ?? 5 };
    } catch (err) {
        return { credits: 0, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

// ─── Ask Live AI ────────────────────────────────────────────

export async function askLiveAI(
    cardId: string,
    userQuestion: string
): Promise<{ answer: string; creditsRemaining: number; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Check credits
        const profile = await getOrCreateProfile(supabase);
        if (!profile || profile.ai_credits <= 0) {
            return {
                answer: '',
                creditsRemaining: 0,
                error: 'No AI credits remaining. Credits reset daily (5 per day).',
            };
        }

        // 2. Fetch the card for context
        const { data: card } = await supabase
            .from('cards')
            .select('id, front, back, explanation, subject, topic, sub_topic, interlink_ids, source_pdf')
            .eq('id', cardId)
            .single();

        if (!card) {
            return { answer: '', creditsRemaining: profile.ai_credits, error: 'Card not found' };
        }

        // 3. Generate embedding for user's question to find related concepts
        const questionEmbedding = await generateEmbedding(userQuestion);

        // 4. Search DB for relevant cards (Vector Search)
        const { data: relatedCards } = await supabase.rpc('match_cards', {
            query_embedding: questionEmbedding,
            match_threshold: 0.70, // Slightly stricter threshold for RAG v2.1
            match_count: 3
        });

        // 4b. Phase 13: Causal Expansion (Fetch interlinked cards)
        let causalContext: any[] = [];
        if (card.interlink_ids && card.interlink_ids.length > 0) {
            const { data: links } = await supabase
                .from('cards')
                .select('id, front, back, explanation, topic')
                .in('id', card.interlink_ids);
            if (links) causalContext = links;
        }

        // 4c. Phase 13: Oracle Context (Check if doubt matches high-lethality patterns)
        let oracleWisdom = '';
        try {
            const { data: latestCal } = await supabase
                .from('oracle_calibrations')
                .select('predicted_themes, year')
                .order('year', { ascending: false })
                .limit(1)
                .single();

            if (latestCal && latestCal.predicted_themes) {
                const matchedTheme = latestCal.predicted_themes.find((t: string) =>
                    userQuestion.toLowerCase().includes(t.toLowerCase()) ||
                    card.topic.toLowerCase().includes(t.toLowerCase())
                );
                if (matchedTheme) {
                    oracleWisdom = `\nORACLE SNIPER ALERT: This doubt relates to the high-lethality theme "${matchedTheme}" predicted for ${latestCal.year}. Explain the trend evolution if relevant.`;
                }
            }
        } catch (e) { /* Oracle context optional */ }

        let dbContext = `BASE CARD CONTEXT (User is viewing this):\n`;
        dbContext += `- Subject: ${card.subject} | Topic: ${card.topic}\n`;
        dbContext += `- Source: ${card.source_pdf || 'Vault'}\n`;
        dbContext += `- Question: ${card.front}\n- Answer: ${card.back}\n`;
        if (card.explanation) dbContext += `- Explanation: ${card.explanation}\n`;

        if (causalContext.length > 0) {
            dbContext += `\nCAUSAL CONNECTIONS (Explicitly linked logic):\n`;
            causalContext.forEach((c: any) => {
                dbContext += `- Linked Topic: ${c.topic} | Idea: ${c.front} -> ${c.back}\n`;
            });
        }

        if (relatedCards && relatedCards.length > 0) {
            const filteredRelated = relatedCards.filter((c: any) => c.id !== cardId && !card.interlink_ids?.includes(c.id));
            if (filteredRelated.length > 0) {
                dbContext += `\nSEMANTIC NEIGHBORS (Similar concepts from Vault):\n`;
                filteredRelated.forEach((c: any, i: number) => {
                    dbContext += `[Concept ${i + 1}] Q: ${c.front} | A: ${c.back}\n`;
                });
            }
        }

        if (oracleWisdom) dbContext += oracleWisdom;

        const userPrompt = `${dbContext}\n\nStudent's doubt: ${userQuestion}`;

        // 6. Call Neural Gateway with augmented context
        const result = await neuralGateway.generateContent({
            model: 'gemini-2.5-flash',
            systemPrompt: PROMPTS.AskAI.SYSTEM,
            userPrompt: userPrompt,
            temperature: 0.4,
            maxTokens: 1024,
        });

        const answer = result.text;

        // 7. Deduct 1 credit
        const newCredits = profile.ai_credits - 1;
        await supabase
            .from('profiles')
            .update({ ai_credits: newCredits })
            .eq('user_id', DEFAULT_USER_ID);

        console.log(`[AskAI] Answered doubt for card ${cardId}. Credits remaining: ${newCredits}`);

        return { answer, creditsRemaining: newCredits };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[AskAI] Error: ${message}`);
        return { answer: '', creditsRemaining: 0, error: message };
    }
}
