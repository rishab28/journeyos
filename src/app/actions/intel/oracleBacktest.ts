'use server';

import { oracleEvolution } from '@/services/oracle/evolution';

interface BacktestResult {
    success: boolean;
    message: string;
    details?: any;
    error?: string;
}

/**
 * Evolution Trigger: Bridging UI to Oracle Evolution Service.
 */
export async function runEvolutionaryStep(year: number): Promise<BacktestResult> {
    try {
        console.log(`[Action: Oracle] Triggering Evolution for Year ${year}`);
        const result = await oracleEvolution.runEvolutionaryStep(year);

        return {
            success: true,
            message: `Evolution successful. Year ${year} calibrated.`,
            details: result
        };
    } catch (error: any) {
        console.error(`[Action: Oracle] Evolution failed for Year ${year}:`, error);
        return {
            success: false,
            message: `Evolution failed for ${year}`,
            error: error.message
        };
    }
}
