'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — 360° Thematic Saturation Engine (Oracle 2.0)
// Generates 12+ multidimensional cards for high-lethality topics
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini';
import { SchemaType } from '@google/generative-ai';
import { generateEmbedding } from '@/lib/ai/gemini';
import { CardType, Difficulty, Subject, Domain } from '@/types';

const CLUSTER_PROMPT = `You are the JourneyOS 'Saturation Sniper'.
A topic has been identified as HIGH LETHALITY (Probability > 85%).
Your task is to saturate the user's brain with every possible dimension of this topic.

TOPIC: {TOPIC}
SUBJECT: {SUBJECT}

GENERATE 12+ CARDS covering these dimensions:
1. Core Fact (Definition/Stat)
2. Logical 'Why' (Principle/Causality)
3. Pattern Trap (Common UPSC distractors)
4. Comparative Analysis (Similar topics/Confusables)
5. Applied MCQ (Statement based)
6. Pair Matching
7. Chronology/Hierarchy
8. Critical Exception / Grey Area
9. Impact/Conclusion (Mains relevance)

Use STRICT JSON format for an array of card objects.`;

export async function generateThematicCluster(
    topic: string,
    subject: Subject,
    domain: Domain = Domain.GS
) {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            front: { type: SchemaType.STRING },
                            back: { type: SchemaType.STRING },
                            type: { type: SchemaType.STRING }, // FLASHCARD, MCQ
                            difficulty: { type: SchemaType.STRING },
                            explanation: { type: SchemaType.STRING },
                            topperTrick: { type: SchemaType.STRING },
                            triggerDna: { type: SchemaType.STRING },
                            evolutionPath: { type: SchemaType.STRING },
                            options: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        id: { type: SchemaType.STRING },
                                        text: { type: SchemaType.STRING },
                                        isCorrect: { type: SchemaType.BOOLEAN }
                                    }
                                }
                            }
                        },
                        required: ["front", "back", "type", "difficulty"]
                    }
                }
            }
        });

        const prompt = CLUSTER_PROMPT
            .replace(/{TOPIC}/g, topic)
            .replace(/{SUBJECT}/g, subject);

        const response = await model.generateContent(prompt);
        const cardsData = JSON.parse(response.response.text());

        const supabase = createServerSupabaseClient();

        // Batch Prepare with Embeddings
        const cardsToInsert = await Promise.all(cardsData.map(async (c: any) => {
            const embedding = await generateEmbedding(`${c.front} ${c.back}`);
            return {
                domain,
                subject,
                topic,
                type: c.type,
                front: c.front,
                back: c.back,
                difficulty: c.difficulty,
                explanation: c.explanation,
                topper_trick: c.topperTrick,
                trigger_dna: c.triggerDna,
                evolution_path: c.evolutionPath,
                options: c.options,
                embedding,
                status: 'live',
                priority_score: 9,
                oracle_confidence: 90
            };
        }));

        const { error } = await supabase.from('cards').insert(cardsToInsert);
        if (error) throw error;

        return {
            success: true,
            count: cardsToInsert.length,
            message: `Thematic Saturation complete for ${topic}. Generated ${cardsToInsert.length} lethal cards.`
        };

    } catch (error) {
        console.error('Cluster Generation Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
