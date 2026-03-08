'use server';

import { oracleSynthesis } from '@/services/oracle/synthesis';

interface SynthesisResult {
    success: boolean;
    message: string;
    newCardsCreated?: number;
    error?: string;
}

/**
 * Synthesis Trigger: Bridging UI to Oracle Synthesis Service.
 */
export async function runLethalSynthesis(): Promise<SynthesisResult> {
    try {
        console.log('[Action: Oracle] Triggering Lethal Synthesis...');
        const result = await oracleSynthesis.runSynthesis();

        return {
            success: true,
            message: `Lethal Synthesis Complete. Fabricated ${result.newCardsCreated} new high-lethality cards for 2026.`,
            newCardsCreated: result.newCardsCreated
        };
    } catch (error: any) {
        console.error('[Action: Oracle] Synthesis Engine Failed:', error);
        return {
            success: false,
            message: 'Synthesis Engine Failed',
            error: error.message
        };
    }
}
