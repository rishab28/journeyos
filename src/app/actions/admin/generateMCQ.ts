'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Generate MCQ from Flashcard (Credit-Based)
// Converts any flashcard into a 4-option MCQ on demand
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

interface MCQResult {
    options: { id: string; text: string; isCorrect: boolean }[];
    creditsRemaining: number;
    error?: string;
}

export async function generateMCQ(
    cardId: string,
    front: string,
    back: string
): Promise<MCQResult> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Check credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .single();

        // Auto-create profile if missing
        if (!profile) {
            await supabase
                .from('profiles')
                .insert({ user_id: DEFAULT_USER_ID, ai_credits: 5 });
        }

        const credits = profile?.ai_credits ?? 5;

        // Check daily reset
        if (profile) {
            const lastReset = new Date(profile.last_credit_reset);
            const hoursSinceReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60);
            if (hoursSinceReset >= 24) {
                await supabase
                    .from('profiles')
                    .update({ ai_credits: 5, last_credit_reset: new Date().toISOString() })
                    .eq('user_id', DEFAULT_USER_ID);
            }
        }

        if (credits <= 0) {
            return {
                options: [],
                creditsRemaining: 0,
                error: 'No AI credits remaining. Credits reset daily (5/day).',
            };
        }

        // 2. Generate MCQ via Gemini
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) return { options: [], creditsRemaining: credits, error: 'API key not configured' };

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            id: { type: SchemaType.STRING },
                            text: { type: SchemaType.STRING },
                            isCorrect: { type: SchemaType.BOOLEAN },
                        },
                        required: ['id', 'text', 'isCorrect'],
                    },
                },
            },
        });

        const prompt = `Generate exactly 4 MCQ options for this UPSC/HAS question. Make distractors UPSC-level tricky and plausible.

Question: ${front}
Correct Answer: ${back}

Return 4 options as JSON array:
- id: "a", "b", "c", "d"
- text: concise option text (max 25 words)
- isCorrect: true for exactly 1, false for others
Randomize the position of the correct answer.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const options = JSON.parse(responseText);

        if (!Array.isArray(options) || options.length !== 4) {
            return { options: [], creditsRemaining: credits, error: 'AI generated invalid options' };
        }

        // 3. Deduct 1 credit
        const newCredits = credits - 1;
        await supabase
            .from('profiles')
            .update({ ai_credits: newCredits })
            .eq('user_id', DEFAULT_USER_ID);

        console.log(`[MCQ Generate] Created MCQ for card ${cardId}. Credits: ${newCredits}`);

        return { options, creditsRemaining: newCredits };
    } catch (err) {
        console.error(`[MCQ Generate] Error:`, err);
        return {
            options: [],
            creditsRemaining: 0,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}
