'use server';

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export interface PipelineHealth {
    lastStoryIngest: string | null;
    lastOracleCalibration: string | null;
    ingestStatus: 'nominal' | 'stale' | 'critical';
    oracleStatus: 'nominal' | 'stale' | 'critical';
}

export async function fetchPipelineHealth(): Promise<{ success: boolean; data?: PipelineHealth; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Get last story
        const { data: lastStory } = await supabase
            .from('stories')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // 2. Get last oracle calibration
        const { data: lastCal } = await supabase
            .from('oracle_calibrations')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const now = new Date();
        const storyTime = lastStory ? new Date(lastStory.created_at) : null;
        const calTime = lastCal ? new Date(lastCal.created_at) : null;

        const getStatus = (time: Date | null, staleLimitHours: number) => {
            if (!time) return 'critical';
            const diffHours = (now.getTime() - time.getTime()) / (1000 * 60 * 60);
            if (diffHours > staleLimitHours * 2) return 'critical';
            if (diffHours > staleLimitHours) return 'stale';
            return 'nominal';
        };

        return {
            success: true,
            data: {
                lastStoryIngest: lastStory?.created_at || null,
                lastOracleCalibration: lastCal?.created_at || null,
                ingestStatus: getStatus(storyTime, 24), // 24h for news
                oracleStatus: getStatus(calTime, 168), // 1 week for oracle
            }
        };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
