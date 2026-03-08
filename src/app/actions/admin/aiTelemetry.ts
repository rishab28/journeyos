'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — AI Intelligence & Cost Management Actions
// Monitors model usage, token counts, and expenses
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export interface AIUsageStats {
    totalCalls: number;
    totalTokens: number;
    estimatedCost: number;
    modelBreakdown: Record<string, { calls: number; tokens: number; cost: number }>;
    sourceBreakdown: Record<string, { calls: number; tokens: number; cost: number }>;
    recentLogs: any[];
}

export async function fetchAIIntelligence(): Promise<{ success: boolean; data?: AIUsageStats; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Fetch recent logs
        const { data: logs, error: logsError } = await supabase
            .from('ai_usage_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (logsError) throw logsError;

        // 2. Fetch Aggregates
        const { data: stats, error: statsError } = await supabase
            .from('ai_usage_logs')
            .select('model_id, source_action, tokens_used, estimated_cost_usd');

        if (statsError) throw statsError;

        const totalCalls = stats.length;
        const totalTokens = stats.reduce((acc, curr) => acc + (curr.tokens_used || 0), 0);
        const estimatedCost = stats.reduce((acc, curr) => acc + (Number(curr.estimated_cost_usd) || 0), 0);

        const modelBreakdown: Record<string, { calls: number; tokens: number; cost: number }> = {};
        const sourceBreakdown: Record<string, { calls: number; tokens: number; cost: number }> = {};

        stats.forEach((row) => {
            const m = row.model_id || 'unknown';
            if (!modelBreakdown[m]) modelBreakdown[m] = { calls: 0, tokens: 0, cost: 0 };
            modelBreakdown[m].calls++;
            modelBreakdown[m].tokens += (row.tokens_used || 0);
            modelBreakdown[m].cost += (Number(row.estimated_cost_usd) || 0);

            const s = row.source_action || 'direct';
            if (!sourceBreakdown[s]) sourceBreakdown[s] = { calls: 0, tokens: 0, cost: 0 };
            sourceBreakdown[s].calls++;
            sourceBreakdown[s].tokens += (row.tokens_used || 0);
            sourceBreakdown[s].cost += (Number(row.estimated_cost_usd) || 0);
        });

        return {
            success: true,
            data: {
                totalCalls,
                totalTokens,
                estimatedCost,
                modelBreakdown,
                sourceBreakdown,
                recentLogs: logs || []
            }
        };

    } catch (error: any) {
        console.error('[AIIntelligence] Failed to fetch AI stats:', error);
        return { success: false, error: error.message };
    }
}
