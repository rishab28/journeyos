'use server';

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export async function getOracleHistory() {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Minimum available year, enforced to at least 1995
        const { data: minYearData } = await supabase
            .from('oracle_raw_papers')
            .select('year')
            .order('year', { ascending: true })
            .limit(1)
            .single();

        const rawMin = minYearData?.year || 1995;
        const enforcedMinYear = Math.max(1995, rawMin);

        // 2. Chronology curve history
        const { data: curveData } = await supabase
            .from('oracle_chronologies')
            .select('year, accuracy_score')
            .order('year', { ascending: true });

        return {
            success: true,
            minYear: enforcedMinYear,
            curve: curveData || []
        };
    } catch (e: any) {
        return { success: false, minYear: 1995, curve: [] };
    }
}

export async function getGenesisRecord(year: number, subject: string) {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('oracle_raw_papers')
            .select('*')
            .eq('year', year)
            .eq('subject', subject)
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
