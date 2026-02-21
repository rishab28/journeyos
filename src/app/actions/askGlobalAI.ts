'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Global Doubt Solver (RAG Engine)
// Synthesizes Rank-1 answers from the global vector database
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateEmbedding, getGeminiClient } from '@/lib/ai/gemini';
import type { StudyCard } from '@/types';

export interface GlobalSearchResponse {
    success: boolean;
    answer?: string;
    sources?: Partial<StudyCard & { similarity: number }>[];
    error?: string;
}

const SYNTHESIS_PROMPT = `
You are the JourneyOS Rank-1 AI Mentor.
A student has asked a complex, inter-disciplinary question.
You have been provided with CONTEXT CARDS from the database that are most relevant to their query.

Your mission:
1. Synthesize a "Rank-1" UPSC level answer using ONLY the provided context cards.
2. Structure the answer clearly with bullet points, bold keywords, and a logical flow.
3. Make explicit inter-disciplinary connections. Show how concepts link together.
4. If the context cards do not contain enough information to answer the query fully, acknowledge the gap but provide the best possible synthesis from what is available.
5. Keep it concise but dense with value. No fluff.

FORMAT: Use clean Markdown.
`;

export async function askGlobalAI(query: string): Promise<GlobalSearchResponse> {
    try {
        if (!query || query.trim().length < 5) {
            return { success: false, error: 'Query is too short.' };
        }

        // 1. Generate Embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // 2. Fetch Top 5 relevant cards via Vector Similarity (RPC)
        const supabase = createServerSupabaseClient();
        const { data: matchedCards, error: matchError } = await supabase.rpc('match_cards', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Reasonably similar cards
            match_count: 5
        });

        if (matchError) {
            console.error('[askGlobalAI] Supabase RPC Error:', matchError);
            return { success: false, error: 'Failed to retrieve context from the database.' };
        }

        if (!matchedCards || matchedCards.length === 0) {
            return { success: false, error: 'No relevant knowledge found in the database. Try ingesting more related PDFs.' };
        }

        // 3. Format Context for Gemini
        let contextText = '--- CONTEXT CARDS ---\n\n';
        matchedCards.forEach((card: any, index: number) => {
            contextText += `[Card ${index + 1}] Subject: ${card.subject} | Topic: ${card.topic}\n`;
            contextText += `Front/Question: ${card.front}\n`;
            contextText += `Back/Answer: ${card.back}\n`;
            if (card.explanation) contextText += `Explanation: ${card.explanation}\n`;
            if (card.custom_analogy) contextText += `Analogy: ${card.custom_analogy}\n`;
            contextText += '---\n';
        });

        // 4. Synthesize the Answer using Gemini 1.5 Flash
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1500,
            }
        });

        const prompt = `${SYNTHESIS_PROMPT}\n\nUSER QUERY: ${query}\n\n${contextText}\n\nRANK-1 SYNTHESIZED ANSWER:\n`;

        const response = await model.generateContent(prompt);
        const answer = response.response.text();

        // 5. Return success with answer and sources
        return {
            success: true,
            answer,
            sources: matchedCards.map((c: any) => ({
                id: c.id,
                front: c.front,
                subject: c.subject,
                topic: c.topic,
                similarity: c.similarity
            }))
        };

    } catch (error) {
        console.error('[askGlobalAI] Error:', error);
        return { success: false, error: 'An unexpected error occurred while synthesizing the answer.' };
    }
}
