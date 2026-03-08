'use server';

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export async function pullSharedIntel(squadIds: string[], lastSyncTime: string) {
    try {
        const supabase = createServerSupabaseClient();
        console.log(`[SyncEngine Action] Pulling cards for Squads: ${squadIds.join(", ")} since ${lastSyncTime}`);

        const { data, error } = await supabase
            .from('shared_intel')
            .select('*')
            .in('squad_id', squadIds)
            .gt('created_at', lastSyncTime);

        if (error) {
            console.error('[SyncEngine Action] Fetch Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (e: any) {
        console.error('[SyncEngine Action] Critical Fetch Error:', e);
        return { success: false, error: e.message };
    }
}
