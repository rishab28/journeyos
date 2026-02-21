'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Ask AI Server Action (Credit-Safe Live Chat)
// 5 credits/day, resets daily, card-context-aware answers
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

function getGeminiClient() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GENAI_API_KEY not configured');
    return new GoogleGenerativeAI(apiKey);
}

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
            .select('front, back, explanation, subject, topic, sub_topic')
            .eq('id', cardId)
            .single();

        if (!card) {
            return { answer: '', creditsRemaining: profile.ai_credits, error: 'Card not found' };
        }

        // 3. Call Gemini with card context + user question
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024,
            },
        });

        const systemPrompt = `You are a friendly UPSC/HAS mentor. A student is confused about a specific flashcard.

CARD CONTEXT:
- Subject: ${card.subject}
- Topic: ${card.topic}${card.sub_topic ? ` > ${card.sub_topic}` : ''}
- Question: ${card.front}
- Answer: ${card.back}
${card.explanation ? `- Explanation: ${card.explanation}` : ''}

RULES:
1. Answer ONLY the student's specific doubt — stay strictly relevant to this card.
2. Use simple Hindi-English (Hinglish) if the student asks in Hindi.
3. Use real-world analogies and examples.
4. Keep response under 150 words.
5. Be encouraging — end with a motivational line.`;

        const result = await model.generateContent([
            systemPrompt,
            `\n\nStudent's doubt: ${userQuestion}`,
        ]);

        const answer = result.response.text();

        // 4. Deduct 1 credit
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
