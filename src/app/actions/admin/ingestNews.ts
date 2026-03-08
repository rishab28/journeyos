'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Live Current Affairs Synapse Engine
// Digests raw news, extracts events, and links them to static DB cards
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { generateEmbedding, getGeminiClient } from '@/lib/core/ai/gemini';
import { revalidatePath } from 'next/cache';

export interface NewsIngestResult {
    success: boolean;
    eventsProcessed: number;
    linksCreated: number;
    linkedCards: Array<{ title: string; event: string }>;
    error?: string;
}

export async function ingestNews(rawText: string): Promise<NewsIngestResult> {
    try {
        if (!rawText || rawText.length < 50) {
            return { success: false, eventsProcessed: 0, linksCreated: 0, linkedCards: [], error: 'Text too short.' };
        }

        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        });

        const prompt = `You are a UPSC Current Affairs expert. I am providing you with today's newspaper editorial or news dump.
Your job is to extract the 3-5 most critical events/concepts that have relevance to the STATIC UPSC syllabus (Polity, Economy, Environment, History, etc.).

For each event, write a 2-3 sentence summary that explains WHAT the event is and WHY it matters for the syllabus.

RAW TEXT:
${rawText}

Respond STRICTLY with this JSON schema:
{
  "events": [
    {
      "headline": "Short Title (e.g. SC Ruling on Article 21)",
      "summary": "Detailed 2-3 sentence explanation of the event."
    }
  ]
}`;

        const response = await model.generateContent(prompt);
        const parsed = JSON.parse(response.response.text());
        const events = parsed.events || [];

        if (events.length === 0) {
            return { success: false, eventsProcessed: 0, linksCreated: 0, linkedCards: [], error: 'No relevant UPSC events found in text.' };
        }

        const supabase = createServerSupabaseClient();
        let linksCreated = 0;
        const linkedCards: Array<{ title: string; event: string }> = [];
        const today = new Date().toISOString().split('T')[0];

        // Process each event
        for (const event of events) {
            // 1. Generate an embedding for the event summary
            const embedding = await generateEmbedding(`${event.headline}. ${event.summary}`);

            // 2. Search for the top 3 most relevant STATIC cards in the database
            const { data: matchedCards } = await supabase.rpc('match_cards', {
                query_embedding: embedding,
                match_threshold: 0.65, // High threshold to ensure genuine connection
                match_count: 3
            });

            if (matchedCards && matchedCards.length > 0) {
                for (const card of matchedCards) {
                    // 3. Append to the current_affairs column
                    const existingCA = card.current_affairs ? card.current_affairs + '\n\n' : '';
                    const newCA = `${existingCA}⚡ [Linked ${today}]: **${event.headline}** - ${event.summary}`;

                    await supabase
                        .from('cards')
                        .update({ current_affairs: newCA })
                        .eq('id', card.id);

                    linksCreated++;
                    linkedCards.push({
                        title: `${card.subject}: ${card.front.substring(0, 40)}...`,
                        event: event.headline
                    });
                }
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/');

        return {
            success: true,
            eventsProcessed: events.length,
            linksCreated,
            linkedCards
        };

    } catch (error) {
        console.error('[Ingest News] Error:', error);
        return {
            success: false,
            eventsProcessed: 0,
            linksCreated: 0,
            linkedCards: [],
            error: error instanceof Error ? error.message : 'Failed to ingest news.'
        };
    }
}
