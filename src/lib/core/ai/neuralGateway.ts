// ═══════════════════════════════════════════════════════════
// JourneyOS — The Neural Gateway (Multi-Model Orchestrator)
// Centralized routing for Cloud, Local, and On-Device models.
// Includes Semantic Caching and Telemetry Tracking.
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { AIError } from './gemini';
import { createServerSupabaseClient } from '../supabase/server';
import crypto from 'crypto';

export type AIModel =
    | 'gemini-2.0-flash'
    | 'gemini-2.5-pro'
    | 'gemini-2.0-flash-lite'
    | 'gemini-2.5-flash-lite'
    | 'gemini-2.5-flash-native-audio-latest'
    | 'claude-3-7-sonnet-20250219'
    | 'claude-3-opus-20240229'
    | 'gemini-embedding-001'
    | 'ollama-local'
    | 'web-llm-local';

export interface GatewayRequest {
    model: AIModel;
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
    bypassCache?: boolean;
    sourceAction?: string; // For telemetry tracking
    metadata?: Record<string, any>;
}

export interface GatewayResponse {
    text: string;
    modelUsed: string;
    tokensIn?: number;
    tokensOut?: number;
    tokensUsed?: number;
    cached?: boolean;
}

const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 4096;
const CACHE_SIMILARITY_THRESHOLD = 0.98;

let currentKeyIndex = 0;

export const neuralGateway = {
    // ─── Main Routing Method ────────────────────────────────────
    async generateContent(req: GatewayRequest): Promise<GatewayResponse> {
        const startTime = Date.now();
        let response: GatewayResponse | null = null;
        let lastError: any = null;

        // 🛡️ Internal Retry Loop for Rate Limits (429)
        const maxInternalRetries = 2; // Reduced from 5 to prevent extreme hanging
        for (let attempt = 0; attempt <= maxInternalRetries; attempt++) {
            try {
                // 1. Check Cache first (only on first attempt)
                if (attempt === 0 && !req.bypassCache) {
                    try {
                        const cached = await this.checkCache(req);
                        if (cached) {
                            await this.logAIUsage(req, cached, true, Date.now() - startTime);
                            return { ...cached, cached: true };
                        }
                    } catch (cacheErr: any) {
                        // Silent fail for cache — avoid blocking the main flow
                        if (cacheErr.status !== 404) {
                            console.warn(`[NeuralGateway] Cache check failed: ${cacheErr.message}`);
                        }
                    }
                }

                console.log(`[NeuralGateway] Routing request to ${req.model} (Attempt ${attempt + 1}/${maxInternalRetries + 1})...`);

                if (req.model.startsWith('claude')) {
                    // Auto-fallback: if no Anthropic key, route to Gemini
                    if (!process.env.ANTHROPIC_API_KEY) {
                        console.warn(`[NeuralGateway] No ANTHROPIC_API_KEY. Auto-routing ${req.model} → gemini-2.5-flash`);
                        response = await this.callGeminiWithRotation({ ...req, model: 'gemini-2.0-flash' });
                    } else {
                        response = await this.callAnthropic(req);
                    }
                } else if (req.model.startsWith('gemini')) {
                    response = await this.callGeminiWithRotation(req);
                } else if (req.model === 'ollama-local') {
                    response = await this.callOllama(req);
                } else if (req.model === 'web-llm-local') {
                    // Browser-only WebLLM bridge
                    const { webLLMBridge } = await import('./webLLMBridge');
                    const text = await webLLMBridge.generate(req.userPrompt, req.systemPrompt);
                    response = { text, modelUsed: 'web-llm-local', tokensUsed: 0 };
                } else {
                    throw new AIError(`Unsupported model architecture: ${req.model}`, 'UNKNOWN');
                }

                // If we got a response, break the retry loop
                if (response) break;

            } catch (error: any) {
                lastError = error;
                const isRateLimit = error.status === 429 || error.code === 'QUOTA_EXHAUSTED' || error.message?.includes('429') || error.message?.includes('quota');

                // Fast-fail if quota is fully exhausted for the model (e.g. 145 hours reset)
                const isHardQuotaExhausted = error.message?.includes('exhausted your capacity') || error.message?.includes('reset after');

                if (isHardQuotaExhausted) {
                    console.error('[NeuralGateway] HARD QUOTA EXHAUSTED. Failing fast to prevent hanging.');
                    throw new AIError(`Model Capacity Exhausted: ${error.message}`, 'QUOTA_EXHAUSTED', false);
                }

                if (isRateLimit && attempt < maxInternalRetries) {
                    // Backoff: 5s, 15s... (Reduced delays)
                    const delay = Math.min(Math.pow(3, attempt) * 5000, 15000);
                    console.warn(`[NeuralGateway] Rate limit hit. Retrying in ${delay / 1000}s (Attempt ${attempt + 1}/${maxInternalRetries})...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }

                // If we exhausted all retries for rate limits
                if (isRateLimit) {
                    console.error(`[NeuralGateway] All API keys exhausted after ${attempt + 1} attempts.`);
                    throw new AIError('All API keys exhausted or rate limits reached. Wait a minute and retry.', 'QUOTA_EXHAUSTED', false);
                }

                throw error;
            }
        }

        if (!response) throw lastError || new Error('Neural Gateway failed to generate content');


        // 2. Save to Cache
        if (!req.bypassCache) {
            try {
                await this.saveToCache(req, response);
            } catch (e) {
                console.warn('[NeuralGateway] Cache save failed, continuing.');
            }
        }

        // 3. Log Usage
        await this.logAIUsage(req, response, false, Date.now() - startTime);

        return response;
    },

    // ─── Telemetry ──────────────────────────────────────────────
    async logAIUsage(req: GatewayRequest, res: GatewayResponse, isCached: boolean, latency: number) {
        try {
            const supabase = await createServerSupabaseClient();
            await supabase.from('ai_usage_logs').insert({
                model: res.modelUsed,
                tokens_in: res.tokensIn || 0,
                tokens_out: res.tokensOut || 0,
                tokens_total: res.tokensUsed || ((res.tokensIn || 0) + (res.tokensOut || 0)),
                source_action: req.sourceAction || 'unknown',
                is_cached: isCached,
                metadata: {
                    latency,
                    ...req.metadata
                }
            });
        } catch (e) {
            console.error('[NeuralGateway] Telemetry logging failed:', e);
        }
    },

    // ─── Caching Logic ──────────────────────────────────────────
    async checkCache(req: GatewayRequest): Promise<GatewayResponse | null> {
        try {
            const supabase = await createServerSupabaseClient();
            const fullPrompt = `${req.systemPrompt || ''}\n${req.userPrompt}`;
            const hash = crypto.createHash('md5').update(fullPrompt).digest('hex');

            const { data: exactMatch } = await supabase
                .from('ai_semantic_cache')
                .select('response_body, model_used, tokens_used')
                .eq('query_hash', hash)
                .single();

            if (exactMatch) return {
                text: typeof exactMatch.response_body === 'string' ? exactMatch.response_body : JSON.stringify(exactMatch.response_body),
                modelUsed: exactMatch.model_used,
                tokensUsed: exactMatch.tokens_used
            };

            if (fullPrompt.length > 200) {
                const embedding = await this.getEmbedding(fullPrompt);
                const { data: semanticMatches } = await supabase.rpc('match_ai_cache', {
                    query_embedding: embedding,
                    match_threshold: CACHE_SIMILARITY_THRESHOLD,
                    match_count: 1
                });

                if (semanticMatches && semanticMatches.length > 0) {
                    const match = semanticMatches[0];
                    return {
                        text: typeof match.response_body === 'string' ? match.response_body : JSON.stringify(match.response_body),
                        modelUsed: 'gemini-2.0-flash',
                        tokensUsed: 0
                    };
                }
            }
            return null;
        } catch (e) {
            console.error('[NeuralGateway] Cache check failed:', e);
            return null;
        }
    },

    async saveToCache(req: GatewayRequest, res: GatewayResponse) {
        try {
            const supabase = await createServerSupabaseClient();
            const fullPrompt = `${req.systemPrompt || ''}\n${req.userPrompt}`;
            const hash = crypto.createHash('md5').update(fullPrompt).digest('hex');

            let embedding = null;
            if (fullPrompt.length > 200) {
                try {
                    embedding = await this.getEmbedding(fullPrompt);
                } catch (e) {
                    // Embedding failed, save without it
                }
            }

            let responseBody = res.text;
            try { responseBody = JSON.parse(res.text); } catch { }

            await supabase.from('ai_semantic_cache').upsert({
                query_hash: hash,
                query_text: fullPrompt.substring(0, 1000),
                response_body: responseBody,
                embedding: embedding,
                model_used: res.modelUsed,
                tokens_used: res.tokensUsed || 0,
                metadata: req.metadata
            }, { onConflict: 'query_hash' });
        } catch (e) {
            console.error('[NeuralGateway] Cache save failed:', e);
        }
    },

    async getEmbedding(text: string): Promise<number[]> {
        const rawKeys = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
        const apiKey = rawKeys.split(',')[0].trim();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(text);
        return Array.from(result.embedding.values);
    },

    // ─── Local Ollama ───────────────────────────────────────────
    async callOllama(req: GatewayRequest): Promise<GatewayResponse> {
        try {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
            const response = await fetch(ollamaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3',
                    prompt: `${req.systemPrompt ? `System: ${req.systemPrompt}\n\n` : ''}User: ${req.userPrompt}`,
                    stream: false,
                    options: { temperature: req.temperature ?? DEFAULT_TEMPERATURE }
                })
            });

            if (!response.ok) throw new Error('Local Ollama instance not reachable');

            const data = await response.json();
            return {
                text: data.response,
                modelUsed: 'ollama-local',
                tokensUsed: data.eval_count || 0
            };
        } catch (e) {
            console.error('[NeuralGateway] Local Ollama failed:', e);
            throw new AIError('Local Fallback failed', 'NETWORK');
        }
    },

    // ─── Gemini Pipeline with Automatic Rotation ─────────────────
    async callGeminiWithRotation(req: GatewayRequest): Promise<GatewayResponse> {
        const rawKeys = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
        const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

        if (apiKeys.length === 0) throw new AIError('Gemini API key missing', 'API_KEY_MISSING');

        let attempts = 0;
        while (attempts < apiKeys.length) {
            const apiKey = apiKeys[currentKeyIndex % apiKeys.length];
            try {
                return await this.executeGeminiCall(req, apiKey);
            } catch (error: any) {
                if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
                    console.warn(`[NeuralGateway] Key index ${currentKeyIndex % apiKeys.length} exhausted. Rotating to next key...`);
                    currentKeyIndex++;
                    attempts++;
                } else {
                    throw error;
                }
            }
        }
        throw new AIError('All Gemini API keys exhausted', 'QUOTA_EXHAUSTED', true);
    },

    async executeGeminiCall(req: GatewayRequest, apiKey: string): Promise<GatewayResponse> {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: req.model,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            generationConfig: {
                temperature: req.temperature ?? DEFAULT_TEMPERATURE,
                maxOutputTokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
                responseMimeType: req.responseFormat === 'json' ? 'application/json' : 'text/plain',
            }
        });

        const fullPrompt = `${req.systemPrompt ? `System: ${req.systemPrompt}\n\nUser: ` : ''}${req.userPrompt}`;
        const result = await model.generateContent(fullPrompt);

        return {
            text: result.response.text(),
            modelUsed: req.model,
            tokensIn: result.response.usageMetadata?.promptTokenCount,
            tokensOut: result.response.usageMetadata?.candidatesTokenCount,
            tokensUsed: result.response.usageMetadata?.totalTokenCount,
        };
    },

    // ─── Anthropic Claude ──────────────────────────────────────
    async callAnthropic(req: GatewayRequest): Promise<GatewayResponse> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new AIError('Anthropic API key missing', 'API_KEY_MISSING');

        const anthropic = new Anthropic({ apiKey });
        let finalSystem = req.systemPrompt || '';
        if (req.responseFormat === 'json') {
            finalSystem += '\n\nIMPORTANT: Your response must be valid JSON only. No other text.';
        }

        const response = await anthropic.messages.create({
            model: req.model,
            max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
            temperature: req.temperature ?? DEFAULT_TEMPERATURE,
            system: finalSystem || undefined,
            messages: [{ role: 'user', content: req.userPrompt }]
        });

        const text = response.content.map((c: any) => c.text || '').join('');
        return {
            text,
            modelUsed: req.model,
            tokensIn: response.usage?.input_tokens,
            tokensOut: response.usage?.output_tokens,
            tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        };
    }
};
