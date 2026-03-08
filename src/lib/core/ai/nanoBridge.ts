// ═══════════════════════════════════════════════════════════
// JourneyOS — Gemini Nano Bridge (Browser-only)
// On-device AI for zero-cost, private inference.
// Requires Chrome v127+ with Prompt API enabled.
// ═══════════════════════════════════════════════════════════

/**
 * Interface for Chrome's experimental Built-in AI (Prompt API)
 */
export interface NanoSession {
    prompt: (text: string) => Promise<string>;
    promptStreaming: (text: string) => AsyncIterable<string>;
    destroy: () => void;
}

export const nanoBridge = {
    /**
     * Checks if Gemini Nano is available in the current browser.
     */
    async isAvailable(): Promise<boolean> {
        if (typeof window === 'undefined') return false;

        // @ts-ignore - window.ai is experimental
        const ai = (window as any).ai;
        if (!ai || !ai.assistant) return false;

        try {
            const capabilities = await ai.assistant.capabilities();
            return capabilities.available !== 'no';
        } catch (e) {
            return false;
        }
    },

    /**
     * Creates a new Nano session for inference.
     */
    async createSession(options?: { systemPrompt?: string }): Promise<NanoSession | null> {
        try {
            if (!(await this.isAvailable())) return null;

            // @ts-ignore
            const session = await (window as any).ai.assistant.create({
                systemPrompt: options?.systemPrompt
            });

            return session;
        } catch (e) {
            console.error('[NanoBridge] Failed to create session:', e);
            return null;
        }
    },

    /**
     * One-shot prompt for simple tasks.
     */
    async quickPrompt(prompt: string, systemPrompt?: string): Promise<string | null> {
        const session = await this.createSession({ systemPrompt });
        if (!session) return null;

        try {
            const response = await session.prompt(prompt);
            session.destroy();
            return response;
        } catch (e) {
            console.error('[NanoBridge] Prompt failed:', e);
            session.destroy();
            return null;
        }
    }
};
