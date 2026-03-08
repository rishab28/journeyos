// ═══════════════════════════════════════════════════════════
// JourneyOS — Gemini AI Integration (Server-only module)
// Content extraction + suggestion validation
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
import type { ExtractedCard } from '@/types';
import { neuralGateway } from './neuralGateway';

// ─── Error Types ────────────────────────────────────────────

export class AIError extends Error {
    constructor(
        message: string,
        public code: 'API_KEY_MISSING' | 'RATE_LIMIT' | 'PARSE_ERROR' | 'NETWORK' | 'UNKNOWN' | 'QUOTA_EXHAUSTED',
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'AIError';
    }
}

// ─── Client Setup ───────────────────────────────────────────

// Maintain index for rotation
let currentKeyIdx = 0;

export function getGeminiClient() {
    const rawKeys = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
    const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

    if (apiKeys.length === 0) {
        throw new AIError(
            'GEMINI_API_KEY is not configured in .env.local',
            'API_KEY_MISSING'
        );
    }

    const apiKey = apiKeys[currentKeyIdx % apiKeys.length];
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Rotates the internal key index for gemini.ts legacy functions
 */
export function rotateGeminiKey() {
    const rawKeys = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
    const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    if (apiKeys.length > 1) {
        currentKeyIdx = (currentKeyIdx + 1) % apiKeys.length;
        console.log(`[GeminiLegacy] Rotating to key index ${currentKeyIdx}`);
    }
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
        } catch (error: any) {
            lastError = error instanceof Error ? error : new Error(String(error));

            const isHardQuotaExhausted = error.message?.includes('exhausted your capacity') || error.message?.includes('reset after');
            if (isHardQuotaExhausted) {
                console.error('[GeminiLegacy] HARD QUOTA EXHAUSTED. Failing fast.');
                throw new AIError(`Model Capacity Exhausted: ${error.message}`, 'QUOTA_EXHAUSTED', false);
            }

            const isQuotaError = error.status === 429 || error.message?.includes('quota');
            if (isQuotaError) {
                console.warn(`[GeminiLegacy] Quota hit on attempt ${attempt + 1}. Rotating key...`);
                rotateGeminiKey();
            }

            if (error instanceof AIError && !error.retryable) throw error;

            if (attempt < maxRetries - 1) {
                const delay = isQuotaError ? 1000 : (baseDelay * Math.pow(2, attempt) + Math.random() * 500);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastError || new AIError('Max retries exceeded', 'UNKNOWN');
}

// ─── JSON Repair Function ───────────────────────────────────

function repairTruncatedJSON(raw: string): unknown[] | null {
    console.log('[JSON Repair] Attempting to salvage truncated response...');

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
                const objStr = raw.substring(objectStart, i + 1);
                try {
                    const obj = JSON.parse(objStr);
                    if (obj.front && obj.back && obj.type) {
                        objects.push(obj);
                    }
                } catch {
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

// ─── Source-Type-Specific Extraction Prompts ────────────────

const EXTRACTION_PROMPTS: Record<string, string> = {
    TEXTBOOK: `You are the JourneyOS 'Oracle Ingestion Engine'. Your task is to extract high-yield learning cards with 'Strategic Density' from the provided TEXTBOOK/REFERENCE MATERIAL.

STRICT STRATEGIC RULES:
1. THE STRATEGIC FILTER: Do not extract every fact. Only extract concepts that are:
    - High-Yield: Frequently asked or conceptually critical for UPSC/HAS.
    - Confusion Hotspots: Concepts that are easily confused with others (e.g., SLF vs SLB).
    - Logic Hooks: Analytical 'Why' points that are essential for Mains.
2. SYLLABUS ALIGNMENT: Every card MUST map to a specific UPSC/HAS syllabus keyword (e.g., 'Federalism', 'Biodiversity', 'Monetary Policy').
3. ATOMIC & ADDICTIVE: 
    - Question (front) and Answer (back) must be under 20 words.
    - Use 'Topper Tone': Conversational, witty, and direct.
    - Use bolding for absolute keywords in the 'back'.

EXTRACTION SCHEME:
4. Create 5-8 cards. Mix of:
    - FLASHCARD: For core definitions/facts.
    - MCQ: For testing logical pitfalls (use 'Logical Fallacies' as distractors).
5. "eliminationTrick": Topper's unique way to guess or eliminate this specifically.
6. "crossRefs": CRITICAL: List 2 interdisciplinary connections (e.g., Ecology connected to IR).
7. "priorityScore": 1-10 based on exam frequency.
8. Use vivid emojis (📍🚀🧠🛡️) to increase visual recall.`,

    PYQ_PAPER: `You are the JourneyOS 'PYQ Pattern Analyzer'. Your task is to extract and analyze PREVIOUS YEAR QUESTIONS from the provided exam paper.

STRICT RULES:
1. EXTRACT ACTUAL QUESTIONS: Extract each question as a card WITH its options and correct answer.
2. PATTERN ANALYSIS: For each question, identify:
    - Which syllabus topic it tests
    - The "question DNA" (Is it factual? Conceptual? Elimination-based? Statement analysis?)
    - Whether it's a repeat pattern from earlier years
3. ALL cards must be type: "PYQ"
4. "isPyqTagged": ALWAYS true
5. "pyqYears": Include the year from the paper
6. "eliminationTrick": How a topper would solve this WITHOUT full knowledge
7. "priorityScore": 9-10 for repeated patterns, 5-7 for one-time topics
8. "front": The actual question text
9. "back": The correct answer with brief explanation
10. Create 8-15 cards per chunk. Quality over quantity.

DO NOT generate generic flashcards. Extract the ACTUAL exam questions.`,

    NOTIFICATION: `You are the JourneyOS 'Administrative Intelligence Extractor'. Your task is to extract KEY ADMINISTRATIVE INFORMATION from an official UPSC/Exam notification or circular.

STRICT RULES:
1. EXTRACT ONLY FACTUAL PROCEDURAL DATA:
    - Important dates (application start/end, exam dates, admit card dates)
    - Eligibility criteria changes
    - Fee structure
    - Age limits and relaxations
    - Vacancy numbers
    - Syllabus changes or additions
    - New rules or policy changes
2. ALL cards must be type: "FLASHCARD"
3. "front": Frame as a direct question (e.g., "What is the last date to apply for UPSC CSE 2026?")
4. "back": The exact factual answer from the notification
5. "priorityScore": 8-10 for dates/deadlines, 5-7 for general info
6. DO NOT try to find exam patterns. DO NOT generate PYQ-style analysis.
7. DO NOT generate MCQs from notifications.
8. Keep it purely informational and factual.
9. "currentAffairs": Tag with the notification date if available.
10. Create 3-6 cards maximum. Only the most critical info.`,

    NEWS: `You are the JourneyOS 'Current Affairs Intelligence Engine'. Your task is to extract UPSC-relevant current affairs from news articles.

STRICT RULES:
1. UPSC RELEVANCE FILTER: Only extract information that connects to UPSC syllabus topics.
2. Create cards that link the news to static syllabus concepts.
3. Mix of FLASHCARD and MCQ types.
4. "currentAffairs": ALWAYS tag with the news date/month.
5. "crossRefs": Link to related static subjects (e.g., Budget news → Economy → Fiscal Policy).
6. "mainsPoint": How this news can be used in a GS Mains answer.
7. "priorityScore": 7-10 for high-impact news.
8. Create 3-6 cards maximum. Focus on UPSC angles only.`,

    NOTES: `You are the JourneyOS 'Notes Synthesizer'. Your task is to create structured learning cards from personal or coaching notes.

STRICT RULES:
1. LIGHTER EXTRACTION: Notes are often informal—clean up language but preserve insights.
2. Focus on unique insights, mnemonics, and shortcuts present in notes.
3. "scaffoldLevel": Assign based on content complexity. Notes often contain 'Foundation' level content.
4. Create FLASHCARD and MCQ cards.
5. "customAnalogy": Preserve any memorable analogies from the notes.
6. "priorityScore": 5-8 based on syllabus alignment.
7. Create 4-7 cards per chunk.`,

    CURRENT_AFFAIRS: `You are the JourneyOS 'Current Affairs Compilation Analyzer'. Your task is to extract exam-worthy current affairs from monthly compilations (Yojana, Kurukshetra, PIB, etc.).

STRICT RULES:
1. SYLLABUS MAPPING: Every card MUST map to a specific GS paper and topic.
2. Create a mix of FLASHCARD and MCQ cards.
3. "currentAffairs": Tag with month/year.
4. "crossRefs": Connect to static concepts (e.g., SDG report → Environment → International Agreements).
5. "mainsPoint": Frame a 2-line Mains-worthy statement for each card.
6. "priorityScore": 6-9 based on likelihood of appearing in next exam.
7. Create 5-8 cards per chunk. Prioritize government schemes and policy changes.
8. Use vivid emojis to increase visual recall.`,

    MINDMAP_PROMPT: `Generate a condensed Mermaid.js mindmap code for the provided topic. 
    Use the format:
    mindmap
      root((Topic))
        Branch1
          SubBranch1
          SubBranch2
    Keep it extremely concise (max 10-15 nodes) and hierarchy-focused.`,

    TRANSLATION_PROMPT: `Translate the following UPSC learning cards into Hindi. 
    Keep the tone 'Topper-like' and accurate. Use Devanagari script.
    Return ONLY a JSON array of translated objects matching the input schema.`
};

const DEFAULT_EXTRACTION_PROMPT = EXTRACTION_PROMPTS.TEXTBOOK;

export async function extractCardsFromText(
    text: string,
    subject: string,
    topic: string,
    failedDistractors: string[] = [],
    interestProfile: string = 'Geopolitics',
    upscIQ: number = 40,
    oracleContext?: { predictedThemes: string[]; learnedLogic: any },
    sourceType: string = 'TEXTBOOK'
): Promise<{ cards: ExtractedCard[]; error?: string }> {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
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
                            crossRefs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            interlinkIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            isPyqTagged: { type: SchemaType.BOOLEAN },
                            pyqYears: { type: SchemaType.STRING },
                            currentAffairs: { type: SchemaType.STRING },
                            priorityScore: { type: SchemaType.INTEGER },
                            subTopic: { type: SchemaType.STRING },
                            difficulty: { type: SchemaType.STRING },
                            scaffoldLevel: { type: SchemaType.STRING },
                            customAnalogy: { type: SchemaType.STRING },
                            topicMap: { type: SchemaType.STRING },
                            translationHindi: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    front: { type: SchemaType.STRING },
                                    back: { type: SchemaType.STRING },
                                    explanation: { type: SchemaType.STRING }
                                }
                            },
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
            const activePrompt = EXTRACTION_PROMPTS[sourceType] || DEFAULT_EXTRACTION_PROMPT;
            const skipOracleSniper = sourceType === 'NOTIFICATION' || sourceType === 'NEWS';

            const userPrompt = `
        SOURCE TYPE: ${sourceType}
        SUBJECT: ${subject}
        TOPIC: ${topic}

        TEXT TO PROCESS:
        ${text}

        SURGICAL UPGRADES (NEW):
        20. "topicMap": Generate a concise Mermaid.js mindmap snippet (using the root node as "${topic}") that visualizes the connections of this specific card's concept.
        21. "translationHindi": Provide a High-Quality Hindi translation of the "front", "back", and "explanation" fields.
        `;

            const systemPrompt = `
        ${activePrompt}

        ---
        PERSONALIZATION ENGINE (CRITICAL):
        The user currently reading these cards has an Interest Profile of: "${interestProfile}" and a baseline UPSC IQ of: ${upscIQ}.
        18. "scaffoldLevel": Assign 'Foundation', 'Intermediate', or 'Advanced' based on the concept's complexity. If it's a core building block, tag it 'Foundation'.
        19. "customAnalogy": Create an ELI5 (Explain Like I'm 5) analogy specifically tailored to their Interest Profile ("${interestProfile}"). Make it highly relatable to help a beginner immediately grasp the concept without using heavy jargon. Max 2-3 lines.
        ---

        ${skipOracleSniper ? '' : `---
        ORACLE SNIPER ENGINE (GOD-MODE ACTIVE):
        The following themes have been predicted as "HIGH LETHALITY" for the 2026 exam based on 15 years of recursive backtesting:
        PREDICTED THEMES: ${oracleContext ? oracleContext.predictedThemes.join(', ') : 'Baseline Patterns'}
        LEARNED LOGIC WEIGHTS: ${oracleContext ? JSON.stringify(oracleContext.learnedLogic) : 'Standard Fact/Logic Balance'}

        INSTRUCTION: If any concept in the text aligns with these themes, tag the card with "oracleConfidence": 90-95 and provide a detailed "trendEvolution" explanation in the card notes.
        ---`}
            `;

            console.log('[Gemini] Initiating gateway.generateContent call...');
            const response = await neuralGateway.generateContent({
                model: 'gemini-2.0-flash',
                systemPrompt,
                userPrompt,
                responseFormat: 'json',
                metadata: { sourceType, subject, topic }
            });

            return {
                response: {
                    text: () => response.text,
                    usageMetadata: { totalTokenCount: response.tokensUsed },
                    candidates: [{ finishReason: 'STOP' }]
                }
            };
        });

        const responseText = result.response.text();
        const finishReason = result.response.candidates?.[0]?.finishReason;
        const usageMetadata = result.response.usageMetadata;

        console.log(`[Gemini] Finish: ${finishReason} | Total Tokens: ${usageMetadata?.totalTokenCount}`);

        let cleanedText = responseText.trim();
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        const startIdx = cleanedText.indexOf('[');
        const endIdx = cleanedText.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanedText = cleanedText.substring(startIdx, endIdx + 1);
        }

        cleanedText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, char => {
            if (char === '\n' || char === '\r' || char === '\t') return char;
            return '';
        });

        let parsed: unknown[];
        try {
            parsed = JSON.parse(cleanedText);
        } catch (parseError: any) {
            console.warn(`[Gemini] JSON parse failed (${parseError.message}). Attempting repair...`);
            const repaired = repairTruncatedJSON(cleanedText);
            if (repaired && repaired.length > 0) {
                parsed = repaired;
            } else {
                throw new Error(`JSON parse failed and repair could not salvage any cards. Reason: ${finishReason || 'unknown'}`);
            }
        }

        const rawCards = (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, any>[];
        const cards: ExtractedCard[] = rawCards
            .filter(c => c.front && c.back && c.type)
            .map(c => ({
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
                topicMap: c.topicMap ? String(c.topicMap) : undefined,
                translations: c.translationHindi ? { hi: c.translationHindi } : undefined,
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
            model: 'gemini-2.0-flash',
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
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const result = await withRetry(async () => {
            return await model.embedContent(text);
        });

        const embedding = result.embedding.values;

        if (!embedding || embedding.length === 0) {
            throw new Error('Gemini returned an empty embedding.');
        }

        console.log(`[Gemini] Generated ${embedding.length}-dimensional embedding.`);
        return Array.from(embedding);
    } catch (error) {
        console.error('[Gemini] Embedding generation failed:', error);
        return new Array(768).fill(0);
    }
}

// ─── Phase 40: Truth-First Agent (Fact-Check) ──────────────

export async function verifyFacts(cards: any[], sourceText: string): Promise<any[]> {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            safetySettings,
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
            },
        });

        const prompt = `You are the 'JourneyOS Fact-Checker'. Cross-reference these ${cards.length} cards against the provided source text.
        Verify:
        1. Dates, names, and numbers match the source perfectly.
        2. Concepts are not hallucinated.
        3. Factual errors are corrected.

        RETURN a JSON array of corrected cards with an additional field "isFactChecked": true.
        If a card is 100% correct, return it as is but with the "isFactChecked" flag.

        Cards: ${JSON.stringify(cards)}
        Source Text (Snippet): ${sourceText.substring(0, 10000)}...`;

        const result = await withRetry(async () => {
            return await model.generateContent(prompt);
        });

        const text = result.response.text();
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('[FactCheck] Agent failed, fallback to original:', e);
        return cards.map(c => ({ ...c, isFactChecked: false }));
    }
}
