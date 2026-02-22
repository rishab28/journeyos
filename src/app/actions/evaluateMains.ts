'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Mains Micro-Evaluation (Topper Feedback)
// Evaluates short answers using UPSC Mains criteria
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/gemini';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface EvalResult {
    score: number;           // 1-10
    keywords: string[];      // UPSC keywords found
    missing: string[];       // Missing key points
    feedback: string;        // Detailed topper feedback
    introLength: number;     // Word count of intro
    bodyStructure: string;   // Analysis of body (e.g., 'Good use of bullets', 'Too paragraph heavy')
    conclusionPresent: boolean;
    topperComparison: string;// Direct comparison to Rank 1 standards
    creditsRemaining: number;
    error?: string;
}

export async function evaluateMains(
    cardId: string,
    question: string,
    userAnswer: string
): Promise<EvalResult> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Check credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .single();

        if (!profile) {
            await supabase
                .from('profiles')
                .insert({ user_id: DEFAULT_USER_ID, ai_credits: 5 });
        }

        const credits = profile?.ai_credits ?? 5;

        // Daily reset
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
                score: 0, keywords: [], missing: [], feedback: '',
                introLength: 0, bodyStructure: 'N/A', conclusionPresent: false, topperComparison: '',
                creditsRemaining: 0,
                error: 'No AI credits remaining. Credits reset daily (5/day).',
            };
        }

        // 2. Fetch specific card context
        const { data: card } = await supabase
            .from('cards')
            .select('front, back, subject, topic, sub_topic, mains_point')
            .eq('id', cardId)
            .single();

        // 3. Global RAG Fetch (Topper Blueprints / Broader Context)
        const queryEmbedding = await generateEmbedding(question);
        const { data: matchedCards } = await supabase.rpc('match_cards', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 2
        });

        let extraContext = '';
        if (matchedCards && matchedCards.length > 0) {
            extraContext = '\nADDITIONAL TOPPER REFERENCE CONTEXT:\n' + matchedCards.map((c: any) => `- ${c.front}: ${c.back}`).join('\n');
        }

        // 4. Evaluate via Gemini (Forcing JSON structure)
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error('API key missing');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1500, responseMimeType: "application/json" },
        });

        const prompt = `You are a STRICT UPSC Mains Rank-1 Examiner. Evaluate this short answer.
You must be ruthless on structure (Intro-Body-Conclusion), word limits, and exact keyword hitting.

CONTEXT:
- Subject: ${card?.subject || 'General'}
- Topic: ${card?.topic || 'General'}
- Question: ${question}
- Core Expectation: ${card?.back || 'N/A'}${extraContext}

STUDENT'S ANSWER:
${userAnswer}

INSTRUCTIONS:
1. "introLength": Count the words in the opening paragraph. A Rank-1 intro hits the core demand in max 25-30 words.
2. "bodyStructure": Analyze how the body is presented (e.g., "Good use of dimensions, but lacking subheadings" or "Rambling paragraph").
3. "conclusionPresent": Boolean indicating if a clear, forward-looking conclusion exists.
4. "topperComparison": A strict 1-line comparison against a hypothetical Rank-1 copy (e.g., "A topper would have cited Article X immediately. Your intro is too generic (45 words).")

Respond strictly with this JSON schema:
{
  "score": number (1-10),
  "keywords": string[],
  "missing": string[],
  "feedback": string (2-3 lines of overall constructive critique),
  "introLength": number,
  "bodyStructure": string,
  "conclusionPresent": boolean,
  "topperComparison": string
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // --- Sanitize JSON Output ---
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Strip invisible control chars that break parse
        cleanedText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
            if (char === '\n' || char === '\r' || char === '\t') return char;
            return '';
        });

        const evalData = JSON.parse(cleanedText);

        // 5. Deduct credit
        const newCredits = credits - 1;
        await supabase
            .from('profiles')
            .update({ ai_credits: newCredits })
            .eq('user_id', DEFAULT_USER_ID);

        return {
            score: evalData.score || 5,
            keywords: evalData.keywords || [],
            missing: evalData.missing || [],
            feedback: evalData.feedback || 'No feedback provided.',
            introLength: evalData.introLength || 0,
            bodyStructure: evalData.bodyStructure || 'Unable to assess structure.',
            conclusionPresent: evalData.conclusionPresent || false,
            topperComparison: evalData.topperComparison || 'Comparsion unavailable.',
            creditsRemaining: newCredits
        };
    } catch (err) {
        console.error('[Mains Eval Strict] Error:', err);
        return {
            score: 0, keywords: [], missing: [], feedback: '',
            introLength: 0, bodyStructure: 'Error evaluating structure', conclusionPresent: false, topperComparison: '',
            creditsRemaining: 0,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}
