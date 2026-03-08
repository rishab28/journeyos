'use server';

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export async function getGenesisVaultData() {
    try {
        const supabase = createServerSupabaseClient();
        console.log('[Oracle UI] Fetching Genesis Vault data via Server Action...');

        const { data, error } = await supabase
            .from('oracle_raw_papers')
            .select('year, subject, questions')
            .order('year', { ascending: false });

        if (error) {
            console.error('[Oracle UI] Error fetching vault:', error);
            return { success: false, error: error.message };
        }

        const formatted = data?.map((d: any) => ({
            year: d.year,
            subject: d.subject,
            count: Array.isArray(d.questions) ? d.questions.length : 0
        })) || [];

        return { success: true, data: formatted };
    } catch (e: any) {
        console.error('[Oracle UI] Critical error fetching vault:', e);
        return { success: false, error: e.message };
    }
}
