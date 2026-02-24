// ═══════════════════════════════════════════════════════════
// JourneyOS — The Neural Gateway (Multi-Model Orchestrator)
// Centralized routing for Opus, Sonnet, and Gemini.
// ═══════════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { AIError } from './gemini'; // Re-use the existing AIError class

export type AIModel = 'gemini-2.5-flash' | 'claude-3-7-sonnet-20250219' | 'claude-3-opus-20240229' | 'text-embedding-004';

export interface GatewayRequest {
    model: AIModel;
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
}

export interface GatewayResponse {
    text: string;
    modelUsed: string;
    tokensUsed?: number;
}

const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 4096;

export const neuralGateway = {
    // ─── Main Routing Method ────────────────────────────────────
    async generateContent(req: GatewayRequest): Promise<GatewayResponse> {
        try {
            console.log(`[NeuralGateway] Routing request to ${req.model}...`);
            if (req.model.startsWith('claude')) {
                return await this.callAnthropic(req);
            } else if (req.model.startsWith('gemini')) {
                return await this.callGemini(req);
            }
            throw new AIError(`Unsupported model architecture: ${req.model}`, 'UNKNOWN');
        } catch (error: any) {
            console.error(`[NeuralGateway] Orchestration failed for ${req.model}:`, error);
            throw error;
        }
    },

    // ─── Gemini Pipeline ────────────────────────────────────────
    async callGemini(req: GatewayRequest): Promise<GatewayResponse> {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new AIError('Gemini API key missing', 'API_KEY_MISSING');

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
            },
        });

        // Gemini handles system instruction differently, but for simplicity we can prepend it
        // Or if using the newer API, there is a `systemInstruction` field.
        // For compatibility with 2.5-flash, standard prompt concatenation is robust.
        const fullPrompt = req.systemPrompt ? `${req.systemPrompt}\n\n---\n\n${req.userPrompt}` : req.userPrompt;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        return {
            text: responseText,
            modelUsed: req.model,
            tokensUsed: result.response.usageMetadata?.totalTokenCount,
        };
    },

    // ─── Anthropic Pipeline ──────────────────────────────────────
    async callAnthropic(req: GatewayRequest): Promise<GatewayResponse> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new AIError('ANTHROPIC_API_KEY is missing in env. Cannot route to Claude.', 'API_KEY_MISSING');

        const anthropic = new Anthropic({ apiKey });

        let finalSystem = req.systemPrompt || '';
        if (req.responseFormat === 'json') {
            finalSystem += '\n\nYou must respond with valid JSON only. Do not wrap in markdown tags like ```json.';
        }

        const msg = await anthropic.messages.create({
            model: req.model,
            max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
            temperature: req.temperature ?? DEFAULT_TEMPERATURE,
            system: finalSystem.trim() || undefined,
            messages: [
                { role: 'user', content: req.userPrompt }
            ]
        });

        const textContent = msg.content.find(c => c.type === 'text');

        return {
            text: textContent?.type === 'text' ? textContent.text : '',
            modelUsed: req.model,
            tokensUsed: msg.usage.input_tokens + msg.usage.output_tokens,
        };
    }
};
