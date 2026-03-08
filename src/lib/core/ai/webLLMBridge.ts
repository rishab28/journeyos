// ═══════════════════════════════════════════════════════════
// JourneyOS — WebLLM Bridge (Browser-only)
// Native on-device inference using WebGPU (Llama-3, etc.)
// No Chrome flags required.
// ═══════════════════════════════════════════════════════════

import * as webllm from "@mlc-ai/web-llm";

export interface WebLLMConfig {
    modelId: string;
    onProgress?: (progress: number, message: string) => void;
}

export class WebLLMBridge {
    private engine: webllm.MLCEngine | null = null;
    private selectedModel = "Llama-3-8B-Instruct-v0.1-q4f16_1-MLC"; // Best balance for UPSC tasks

    async initialize(config?: WebLLMConfig) {
        if (this.engine) return;

        try {
            this.engine = new webllm.MLCEngine();
            this.engine.setInitProgressCallback((report: any) => {
                if (config?.onProgress) {
                    // Extract numeric progress from report.text if possible
                    config.onProgress(0, report.text);
                }
            });

            await this.engine.reload(config?.modelId || this.selectedModel);
            console.log("[WebLLM] Engine initialized and model loaded.");
        } catch (e) {
            console.error("[WebLLM] Initialization failed:", e);
            this.engine = null;
            throw e;
        }
    }

    async generate(prompt: string, systemPrompt?: string): Promise<string> {
        if (!this.engine) await this.initialize();
        if (!this.engine) throw new Error("WebLLM Engine failed to initialize");

        const messages: webllm.ChatCompletionMessageParam[] = [];
        if (systemPrompt) {
            messages.push({ role: "system", content: systemPrompt });
        }
        messages.push({ role: "user", content: prompt });

        const reply = await this.engine.chat.completions.create({
            messages,
            temperature: 0.3,
        });

        return reply.choices[0].message.content || "";
    }

    async unload() {
        if (this.engine) {
            await this.engine.unload();
            this.engine = null;
        }
    }
}

// Singleton instance for global use in client components
export const webLLMBridge = new WebLLMBridge();
