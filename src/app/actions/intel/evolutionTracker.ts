'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Intelligence Evolution Tracker
// Monitors and logs the meta-learning growth of the Oracle.
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

interface IQMetrics {
    patternAccuracy: number;
    causalDensity: number;
    nodeCoverage: number;
    reasoningShift: string;
    logicSnapshot: any;
}

/**
 * Logs the current intelligence state of the system.
 * This is triggered at the end of every backtest cycle.
 */
export async function logSystemEvolution(metrics: IQMetrics) {
    try {
        const supabase = createServerSupabaseClient();

        const { error } = await supabase.from('system_iq_evolution').insert({
            pattern_accuracy: metrics.patternAccuracy,
            causal_density: metrics.causalDensity,
            node_coverage: metrics.nodeCoverage,
            reasoning_shift: metrics.reasoningShift,
            evolved_logic_snapshot: metrics.logicSnapshot
        });

        if (error) throw error;

        console.log(`[Evolution] Logged System IQ: ${metrics.patternAccuracy}% accuracy.`);
        return { success: true };

    } catch (error) {
        console.error('[Evolution Tracker] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Calculates current 'Syllabus Coverage' across all calibrations.
 */
export async function calculateSyllabusCoverage() {
    try {
        const supabase = createServerSupabaseClient();

        // Count mapped nodes in calibrations
        const { data: calibrations } = await supabase.from('oracle_calibrations').select('causal_audit');
        const { count: totalNodes } = await supabase.from('syllabus_nodes').select('*', { count: 'exact', head: true });

        if (!calibrations || !totalNodes) return 0;

        const mappedNodes = new Set();
        calibrations.forEach(cal => {
            const audit = cal.causal_audit;
            if (audit?.causalMap) {
                audit.causalMap.forEach((m: any) => {
                    if (m.nodeId) mappedNodes.add(m.nodeId);
                });
            }
        });

        const coverage = (mappedNodes.size / totalNodes) * 100;
        return coverage;

    } catch (error) {
        console.error('[Evolution] Coverage calc failed:', error);
        return 0;
    }
}
