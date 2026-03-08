'use server';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export async function resetOracleEvolution() {
    try {
        const supabase = createServerSupabaseClient();
        console.log('[Oracle UI] Resetting Evolution Chronologies...');

        // 1. Capture the latest logic weights before wiping
        const { data: latest } = await supabase
            .from('oracle_chronologies')
            .select('logic_weights')
            .order('year', { ascending: false })
            .limit(1)
            .single();

        const savedWeights = latest?.logic_weights || { factual_bias: 0.5, conceptual_bias: 0.5 };

        // 2. Wipe the timeline
        const { error } = await supabase
            .from('oracle_chronologies')
            .delete()
            .neq('year', 0); // Delete all rows safely

        if (error) {
            console.error('[Oracle UI] Error resetting chronologies:', error);
            return { success: false, error: error.message };
        }

        // 3. Seed 1994 so the 1995 loop inherits previous cycle's intelligence
        await supabase.from('oracle_chronologies').insert({
            year: 1994,
            logic_weights: savedWeights,
            updated_at: new Date().toISOString()
        });

        return { success: true };
    } catch (e: any) {
        console.error('[Oracle UI] Critical error resetting chronologies:', e);
        return { success: false, error: e.message };
    }
}
