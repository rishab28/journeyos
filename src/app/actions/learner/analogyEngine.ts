'use server';

import { neuralGateway } from '@/lib/core/ai/neuralGateway';

/**
 * Generates a personalized analogy for a concept based on user's interests.
 * Part of Neural Core 2.0 — Remedial Learning
 */
export async function generateAIAnalogy(
    concept: string,
    context: string,
    interestProfile: string = 'General'
): Promise<{ success: boolean; analogy?: string; error?: string }> {
    try {
        const prompt = `You are the JourneyOS 'Neural Tutor'.
The user is struggling to grasp a concept.
CONCEPT: ${concept}
CONTEXT: ${context}
USER INTEREST: ${interestProfile}

TASK: Create a vivid, highly relatable analogy that explains this CONCEPT using the USER INTEREST as the source domain.
The analogy should be concise, witty, and 'stick' in the user's mind.

Output JSON:
{
  "analogy": "The analogy itself...",
  "explanation": "Why this analogy works..."
}`;

        const result = await neuralGateway.generateContent({
            model: 'gemini-2.0-flash',
            userPrompt: prompt,
            responseFormat: 'json',
            temperature: 0.8
        });
        const response = JSON.parse(result.text);

        return {
            success: true,
            analogy: response.analogy
        };

    } catch (error) {
        console.error('[Analogy Infusion] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate analogy'
        };
    }
}
