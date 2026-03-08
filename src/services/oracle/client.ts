import https from 'https';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Nexus: Unified AI Client
// Strategic AI Orchestration with DNS Failover & Key Rotation.
// Includes retry-after backoff for rate limits.
// ═══════════════════════════════════════════════════════════

export interface OracleAIRequest {
    prompt: string;
    systemInstruction?: string;
    model?: string;
    temperature?: number;
    jsonMode?: boolean;
}

export interface OracleAIResponse {
    text: string;
    usage?: {
        promptTokens: number;
        candidatesTokens: number;
        totalTokens: number;
    };
}

const DEFAULT_MODEL = 'gemini-2.0-flash';
// Fallback models when primary is 429'd — ordered by capability
const FALLBACK_MODELS = ['gemma-3-27b-it', 'gemma-3-12b-it'];
const HOSTNAME = 'generativelanguage.googleapis.com';
const FALLBACK_IPS = ['216.239.38.223', '216.239.34.223'];

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Extracts retry-after seconds from a Gemini 429 error message.
 */
function parseRetryAfter(errorMessage: string): number {
    const match = errorMessage?.match(/retry in (\d+\.?\d*)/i);
    if (match) return Math.ceil(parseFloat(match[1]));
    return 25;
}

export class OracleAIClient {
    private apiKeys: string[];
    private currentKeyIndex: number = 0;

    constructor() {
        const raw = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
        this.apiKeys = raw.split(',').map(k => k.trim()).filter(Boolean);

        if (this.apiKeys.length === 0) {
            console.error('[OracleAIClient] CRITICAL: No API keys configured.');
        }
    }

    /**
     * Tries a single generation call with a specific model and key.
     * Returns the text on success, or throws on error.
     */
    private async tryGenerate(apiKey: string, modelName: string, req: OracleAIRequest): Promise<string> {
        const isGemma = modelName.startsWith('gemma');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings,
            generationConfig: {
                temperature: req.temperature ?? 0.4,
                responseMimeType: (!isGemma && req.jsonMode) ? 'application/json' : 'text/plain',
            }
        });

        // Gemma models don't support systemInstruction — prepend to prompt instead
        let userPrompt = req.prompt;
        if (isGemma && req.systemInstruction) {
            userPrompt = `INSTRUCTIONS: ${req.systemInstruction}\n\n${req.prompt}`;
        }

        const systemPart = (!isGemma && req.systemInstruction) ? { text: req.systemInstruction } : undefined;
        //@ts-ignore
        const result = await model.generateContent({
            ...(systemPart ? { systemInstruction: systemPart } : {}),
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
        });

        return result.response.text();
    }

    // Track exhausted models to skip them in subsequent calls
    private exhaustedModels: Map<string, number> = new Map(); // model → expiry timestamp
    private static EXHAUSTION_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Executes an AI request with:
     * 1. Key rotation on 429
     * 2. Model cascade fallback (gemini-2.0-flash → gemma-3-27b-it → gemma-3-12b-it)
     * 3. Sticky exhaustion — once a model is 429'd, skip it for 5 min
     */
    async generate(req: OracleAIRequest): Promise<string> {
        const requestedModel = req.model || DEFAULT_MODEL;
        const modelsToTry = [requestedModel, ...FALLBACK_MODELS.filter(m => m !== requestedModel)];

        while (true) {
            const now = Date.now();
            let allExhausted = true;
            let earliestExpiry = Infinity;

            for (const modelName of modelsToTry) {
                // Skip models that were recently exhausted
                const expiresAt = this.exhaustedModels.get(modelName);
                if (expiresAt && now < expiresAt) {
                    console.log(`[OracleAIClient] Skipping ${modelName} (exhausted, recheck in ${Math.ceil((expiresAt - now) / 1000)}s)`);
                    earliestExpiry = Math.min(earliestExpiry, expiresAt);
                    continue;
                }

                allExhausted = false;
                let lastError: any = null;

                for (let i = 0; i < this.apiKeys.length; i++) {
                    const keyIdx = (this.currentKeyIndex + i) % this.apiKeys.length;
                    const apiKey = this.apiKeys[keyIdx];
                    try {
                        const text = await this.tryGenerate(apiKey, modelName, req);
                        console.log(`[OracleAIClient] ✅ Success with ${modelName} (key ${keyIdx})`);
                        // Model works — remove from exhausted list
                        this.exhaustedModels.delete(modelName);
                        return text;
                    } catch (error: any) {
                        lastError = error;
                        const errorMsg = error.message || '';
                        const isRetryable = error.status === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('ETIMEDOUT');

                        if (isRetryable) {
                            continue;
                        } else {
                            console.error(`[OracleAIClient] ${modelName} error: ${errorMsg.substring(0, 100)}`);
                            break;
                        }
                    }
                }
                // Mark model as exhausted for 5 minutes
                this.exhaustedModels.set(modelName, now + OracleAIClient.EXHAUSTION_TTL);
                console.warn(`[OracleAIClient] ${modelName} exhausted. Blacklisted for 5 min. Falling back...`);
                earliestExpiry = Math.min(earliestExpiry, now + OracleAIClient.EXHAUSTION_TTL);
            }

            if (allExhausted) {
                const waitTimeMs = Math.max(earliestExpiry - Date.now(), 5000);
                console.warn(`[OracleAIClient] 🛑 ALL MODELS EXHAUSTED. Waiting ${Math.ceil(waitTimeMs / 1000)}s for quotas to refresh...`);
                await new Promise(r => setTimeout(r, waitTimeMs));
                // Loop continues, checking if models have expired from blacklist
            }
        }
    }

    /**
     * Uploads a buffer to Google File API with rotation and failover.
     * Returns the full file URI and the API key used (for stickiness).
     */
    async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<{ fileUri: string; apiKey: string }> {
        let attempts = 0;
        const maxAttempts = this.apiKeys.length;

        while (attempts < maxAttempts) {
            const apiKey = this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
            const boundary = `b${Date.now()}`;
            const metadata = JSON.stringify({ file: { displayName: filename } });

            const doUpload = (hostname: string): Promise<any> => new Promise((resolve, reject) => {
                const req = https.request({
                    hostname, port: 443,
                    path: `/upload/v1beta/files?key=${apiKey}`,
                    method: 'POST',
                    headers: {
                        'X-Goog-Upload-Protocol': 'multipart',
                        'Content-Type': `multipart/related; boundary=${boundary}`,
                        'Host': HOSTNAME,
                    },
                    servername: HOSTNAME,
                    timeout: 120000,
                }, (res) => {
                    let data = '';
                    res.on('data', c => data += c);
                    res.on('end', () => {
                        if (res.statusCode === 429) reject(new Error('429_RATE_LIMIT'));
                        else if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            try { resolve(JSON.parse(data)); } catch { reject(new Error('Upload JSON parse failed')); }
                        } else reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    });
                });
                req.on('error', reject);
                req.write(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`);
                req.write(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
                req.write(buffer);
                req.write(`\r\n--${boundary}--\r\n`);
                req.end();
            });

            try {
                let lastError;
                for (const host of [HOSTNAME, ...FALLBACK_IPS]) {
                    try {
                        const result = await doUpload(host);
                        return { fileUri: result.file.uri, apiKey };
                    } catch (e: any) {
                        lastError = e;
                        if (e.message === '429_RATE_LIMIT') break;
                        console.warn(`[OracleAIClient] Upload to ${host} failed:`, e.message);
                    }
                }

                if (lastError?.message === '429_RATE_LIMIT') {
                    console.warn(`[OracleAIClient] Upload key ${this.currentKeyIndex % this.apiKeys.length} rate-limited. Rotating...`);
                    this.currentKeyIndex++;
                    attempts++;
                    await new Promise(r => setTimeout(r, 5000)); // Wait 5s before trying next key
                    continue;
                }
                throw lastError || new Error('Upload failed on all hosts.');
            } catch (error: any) {
                if (error.message === '429_RATE_LIMIT') {
                    this.currentKeyIndex++;
                    attempts++;
                    await new Promise(r => setTimeout(r, 5000));
                } else throw error;
            }
        }
        throw new Error('Oracle AI: File upload failed after exhausting all keys.');
    }

    /**
     * Generates content from an uploaded file URI.
     * Supports stickyApiKey for multimodal permissions.
     */
    async generateFromFile(fileUri: string, req: OracleAIRequest, stickyApiKey?: string): Promise<string> {
        let attempts = 0;
        const maxAttempts = stickyApiKey ? 1 : this.apiKeys.length;

        while (attempts < maxAttempts) {
            const apiKey = stickyApiKey || this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: req.model || DEFAULT_MODEL,
                    safetySettings,
                    generationConfig: {
                        temperature: req.temperature ?? 0.1,
                        responseMimeType: req.jsonMode ? 'application/json' : 'text/plain'
                    }
                });

                const systemPart = req.systemInstruction ? { text: req.systemInstruction } : undefined;
                //@ts-ignore
                const result = await model.generateContent({
                    systemInstruction: systemPart,
                    contents: [{
                        role: 'user',
                        parts: [
                            { fileData: { mimeType: 'application/pdf', fileUri } },
                            { text: req.prompt }
                        ]
                    }]
                });

                return result.response.text();
            } catch (error: any) {
                const errorBody = error.response?.data || error.message;
                if (error.status === 429 || error.message?.includes('429')) {
                    console.warn(`[OracleAIClient] Key ${this.currentKeyIndex % this.apiKeys.length} rate-limited on generateFromFile.`);
                    this.currentKeyIndex++;
                    throw new Error('429_RATE_LIMIT');
                } else {
                    console.error(`[OracleAIClient] generateFromFile Failed: ${errorBody}`);
                    throw error;
                }
            }
        }
        throw new Error('Oracle AI: generateFromFile failed after exhausting all keys.');
    }

    /**
     * Generate embeddings using text-embedding-004
     */
    async embed(text: string): Promise<number[]> {
        const apiKey = this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        try {
            const result = await model.embedContent(text);
            return Array.from(result.embedding.values);
        } catch (e) {
            console.error('[OracleAIClient] Embedding failed:', e);
            throw e;
        }
    }
}

export const oracleAI = new OracleAIClient();
