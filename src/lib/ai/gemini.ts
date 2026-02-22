// ═══════════════════════════════════════════════════════════
// JourneyOS — Gemini AI Integration (Server-only module)
// Content extraction + suggestion validation
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
import type { ExtractedCard } from '@/types';

// ─── Error Types ────────────────────────────────────────────

export class AIError extends Error {
    constructor(
        message: string,
        public code: 'API_KEY_MISSING' | 'RATE_LIMIT' | 'PARSE_ERROR' | 'NETWORK' | 'UNKNOWN',
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'AIError';
    }
}

// ─── Client Setup ───────────────────────────────────────────

export function getGeminiClient() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new AIError(
            'GOOGLE_GENAI_API_KEY is not configured in .env.local',
            'API_KEY_MISSING'
        );
    }
    return new GoogleGenerativeAI(apiKey);
}

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ─── Retry Logic ────────────────────────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (error instanceof AIError && !error.retryable) throw error;
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastError || new AIError('Max retries exceeded', 'UNKNOWN');
}

// ─── JSON Repair Function ───────────────────────────────────
// When Gemini hits MAX_TOKENS, the JSON is truncated mid-string.
// This function attempts to salvage complete card objects.

function repairTruncatedJSON(raw: string): unknown[] | null {
    console.log('[JSON Repair] Attempting to salvage truncated response...');

    // Strategy: find all complete JSON objects in the array
    // by matching balanced braces
    const objects: unknown[] = [];
    let depth = 0;
    let inString = false;
    let escape = false;
    let objectStart = -1;

    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];

        if (escape) {
            escape = false;
            continue;
        }
        if (ch === '\\' && inString) {
            escape = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (ch === '{') {
            if (depth === 0) objectStart = i;
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0 && objectStart !== -1) {
                // We have a complete object
                const objStr = raw.substring(objectStart, i + 1);
                try {
                    const obj = JSON.parse(objStr);
                    if (obj.front && obj.back && obj.type) {
                        objects.push(obj);
                    }
                } catch {
                    // Skip malformed object
                }
                objectStart = -1;
            }
        }
    }

    if (objects.length > 0) {
        console.log(`[JSON Repair] Successfully salvaged ${objects.length} complete card(s) from truncated response.`);
        return objects;
    }

    return null;
}

// ─── Card Extraction ────────────────────────────────────────

const EXTRACTION_PROMPT = `Bhai Gemini, cards abhi bohot heavy hain. Inhe 'Addictive & Snackable' banana hai.
TASK: Extract high-yield learning cards from the text below.

STRICT ATOMIC RULES:
1. THE 20-WORD LIMIT: "front" (question) aur "back" (answer) dono MAX 15-20 words ke hone chahiye. Zyada detail "explanation" ya "mainsPoint" mein dalo.
2. TOPPER TONE: Boring academic language hatao. Tone 'Conversational' rakho—jaise ek AIR 1 topper apne dost ko short mein 'Pro-Tip' de raha ho. 
3. SNACKABLE FORMATting: "back" field MUST be extremely crisp. Use **Bold keywords** heavily. 

DETAILS:
4. Atomicity: EK card = EK simple fact. Complex concepts ko 3-4 cards mein tod do.
5. Create 5 to 7 cards maximum. Mix of FLASHCARD, MCQ, and PYQ-style cards.
6. MCQs: exactly 4 options, 1 correct. Options should be "Clean" and direct.
7. Use emojis (📍🚀🧠🛡️) to make it visually addictive.
8. Identify specific "subTopic" for each card.
` + `9. "eliminationTrick": Topper's smart MCQ guessing or elimination strategy. Max 1 line.
10. "logicDerivation": Detailed analytical derivation (optional). Max 1 line.
11. "crossRefs": CRITICAL: List 2-3 connections to OTHER unrelated subjects.
12. "isPyqTagged": True/false if asked in UPSC CSE/HAS in last 10 years.
13. "pyqYears": If isPyqTagged is true, list the exam and year(s).
14. "currentAffairs": 1-line connection if in news recently.
15. "priorityScore": Assign an integer from 1 to 10 based on exam weightage.
16. "options" field is ONLY for MCQ type. Omit for FLASHCARD and PYQ.
Return ONLY valid JSON matching the schema.`;

export async function extractCardsFromText(
    text: string,
    subject: string,
    topic: string,
    failedDistractors: string[] = [], // Arsenal V2: Dynamic Distractor Evolution
    interestProfile: string = 'Geopolitics',
    upscIQ: number = 40
): Promise<{ cards: ExtractedCard[]; error?: string }> {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings,
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                maxOutputTokens: 65536,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            type: { type: SchemaType.STRING },
                            front: { type: SchemaType.STRING },
                            back: { type: SchemaType.STRING },
                            explanation: { type: SchemaType.STRING },
                            topperTrick: { type: SchemaType.STRING },
                            eliminationTrick: { type: SchemaType.STRING },
                            mainsPoint: { type: SchemaType.STRING },
                            syllabusTopic: { type: SchemaType.STRING },
                            logicDerivation: { type: SchemaType.STRING },
                            crossRefs: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.STRING },
                            },
                            interlinkIds: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.STRING },
                            },
                            isPyqTagged: { type: SchemaType.BOOLEAN },
                            pyqYears: { type: SchemaType.STRING },
                            currentAffairs: { type: SchemaType.STRING },
                            priorityScore: { type: SchemaType.INTEGER },
                            subTopic: { type: SchemaType.STRING },
                            difficulty: { type: SchemaType.STRING },
                            scaffoldLevel: { type: SchemaType.STRING },
                            customAnalogy: { type: SchemaType.STRING },
                            options: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        id: { type: SchemaType.STRING },
                                        text: { type: SchemaType.STRING },
                                        isCorrect: { type: SchemaType.BOOLEAN }
                                    },
                                    required: ["id", "text", "isCorrect"]
                                }
                            }
                        },
                        required: ["type", "front", "back", "difficulty"]
                    }
                }
            },
        });

        const result = await withRetry(async () => {
            const promptText = `
        ${EXTRACTION_PROMPT}

        ---
        PERSONALIZATION ENGINE (CRITICAL):
        The user currently reading these cards has an Interest Profile of: "${interestProfile}" and a baseline UPSC IQ of: ${upscIQ}.
        18. "scaffoldLevel": Assign 'Foundation', 'Intermediate', or 'Advanced' based on the concept's complexity. If it's a core building block, tag it 'Foundation'.
        19. "customAnalogy": Create an ELI5 (Explain Like I'm 5) analogy specifically tailored to their Interest Profile ("${interestProfile}"). Make it highly relatable to help a beginner immediately grasp the concept without using heavy jargon. Max 2-3 lines.
        ---

        CONTEXT METADATA:
        Subject: ${subject}
        Topic: ${topic}
        ${failedDistractors.length > 0 ? `CRITICAL MCQ INSTRUCTION: Use these specific concepts as distractors (wrong options) because the user specifically gets confused by them: ${failedDistractors.join(', ')}` : ''}

        TEXT TO PROCESS:
        ${text}
        `;
            // Call model directly with text instead of array wrapper
            console.log('[Gemini] Initiating model.generateContent call...');
            const response = await model.generateContent(promptText);
            console.log('[Gemini] Received response from model.generateContent.');
            return response;
        });

        const responseText = result.response.text();
        const finishReason = result.response.candidates?.[0]?.finishReason;
        const usageMetadata = result.response.usageMetadata;

        console.log(`[Gemini] Finish: ${finishReason} | Prompt: ${usageMetadata?.promptTokenCount} tokens | Output: ${usageMetadata?.candidatesTokenCount} tokens`);

        // ─── JSON SANITIZER ───
        let cleanedText = responseText.trim();

        // 1. Strip markdown code fences
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // 2. Extract the JSON array
        const startIdx = cleanedText.indexOf('[');
        const endIdx = cleanedText.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanedText = cleanedText.substring(startIdx, endIdx + 1);
        }

        // 3. Strip invisible control characters
        cleanedText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
            if (char === '\n' || char === '\r' || char === '\t') return char;
            return '';
        });

        // ─── PARSE (with repair fallback) ───
        let parsed: unknown[];
        try {
            parsed = JSON.parse(cleanedText);
        } catch (parseError: any) {
            console.warn(`[Gemini] JSON parse failed (${parseError.message}). Attempting repair...`);

            // Try to salvage complete objects from truncated response
            const repaired = repairTruncatedJSON(cleanedText);
            if (repaired && repaired.length > 0) {
                parsed = repaired;
            } else {
                console.error("====================== RAW GEMINI OUTPUT ======================");
                console.error(cleanedText.substring(0, 500) + "...");
                console.error("================================================================");
                throw new Error(`JSON parse failed and repair could not salvage any cards. Reason: ${finishReason || 'unknown'}`);
            }
        }

        // Validate and normalize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawCards = (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, any>[];
        const cards: ExtractedCard[] = rawCards
            .filter((c) => c.front && c.back && c.type)
            .map((c) => ({
                type: c.type as ExtractedCard['type'],
                front: String(c.front),
                back: String(c.back),
                explanation: c.explanation ? String(c.explanation) : undefined,
                topperTrick: c.topperTrick ? String(c.topperTrick) : undefined,
                eliminationTrick: c.eliminationTrick ? String(c.eliminationTrick) : undefined,
                mainsPoint: c.mainsPoint ? String(c.mainsPoint) : undefined,
                syllabusTopic: c.syllabusTopic ? String(c.syllabusTopic) : undefined,
                logicDerivation: c.logicDerivation ? String(c.logicDerivation) : undefined,
                crossRefs: Array.isArray(c.crossRefs) ? c.crossRefs.map(String) : undefined,
                interlinkIds: Array.isArray(c.interlinkIds) ? c.interlinkIds.map(String) : undefined,
                isPyqTagged: c.isPyqTagged === true,
                pyqYears: c.pyqYears ? String(c.pyqYears) : undefined,
                currentAffairs: c.currentAffairs ? String(c.currentAffairs) : undefined,
                priorityScore: typeof c.priorityScore === 'number' ? c.priorityScore : 5,
                subTopic: c.subTopic ? String(c.subTopic) : undefined,
                difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(String(c.difficulty)) ? c.difficulty : 'MEDIUM') as ExtractedCard['difficulty'],
                scaffoldLevel: (['Foundation', 'Intermediate', 'Advanced'].includes(String(c.scaffoldLevel)) ? c.scaffoldLevel : 'Foundation') as ExtractedCard['scaffoldLevel'],
                customAnalogy: c.customAnalogy ? String(c.customAnalogy) : undefined,
                options: c.type === 'MCQ' && Array.isArray(c.options) ? c.options as ExtractedCard['options'] : undefined,
            }));

        if (cards.length === 0) {
            return { cards: [], error: 'AI generated a response but no valid cards could be extracted.' };
        }

        console.log(`[Gemini] Successfully extracted ${cards.length} cards.`);
        return { cards };
    } catch (error) {
        if (error instanceof AIError) {
            return { cards: [], error: error.message };
        }
        return { cards: [], error: `AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

// ─── Suggestion Validation ──────────────────────────────────

const VALIDATION_PROMPT = `You are an expert fact-checker for competitive exam content (UPSC/HAS).

Compare the ORIGINAL card with the USER'S SUGGESTION. Evaluate:
1. Is the suggestion factually correct?
2. Does it improve clarity or accuracy?
3. Should we accept this change?

Return a JSON object:
{
  "approved": true | false,
  "reason": "Brief explanation of your decision",
  "updatedFront": "The final front text (use suggestion if approved, original if not)",
  "updatedBack": "The final back text (use suggestion if approved, original if not)"
}`;

export interface ValidationResult {
    approved: boolean;
    reason: string;
    updatedFront: string;
    updatedBack: string;
}

export async function validateSuggestion(
    originalFront: string,
    originalBack: string,
    suggestedFront: string,
    suggestedBack: string
): Promise<{ result: ValidationResult | null; error?: string }> {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
            },
        });

        const response = await withRetry(async () => {
            return await model.generateContent([
                VALIDATION_PROMPT,
                `\n\nORIGINAL CARD:\nFront: ${originalFront}\nBack: ${originalBack}\n\nUSER SUGGESTION:\nFront: ${suggestedFront}\nBack: ${suggestedBack}`,
            ]);
        });

        const parsed = JSON.parse(response.response.text());
        return {
            result: {
                approved: Boolean(parsed.approved),
                reason: String(parsed.reason || ''),
                updatedFront: String(parsed.updatedFront || originalFront),
                updatedBack: String(parsed.updatedBack || originalBack),
            },
        };
    } catch (error) {
        if (error instanceof AIError) {
            return { result: null, error: error.message };
        }
        return { result: null, error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

// ─── Phase 17: RAG Vector Embeddings ───────────────────────

/**
 * Generates a 768-dimensional embedding for the given text using text-embedding-004.
 * Note: Temporarily mocked due to 404 errors on all embedding endpoints for this API key.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    console.warn('[Gemini] Mocking embedding generation due to API endpoint 404s.');
    return new Array(768).fill(0.001); // 768-dimensional mock embedding
}
