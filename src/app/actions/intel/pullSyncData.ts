'use server';

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export async function pullSyncData(lastSyncTime: string, userId?: string) {
    try {
        const supabase = createServerSupabaseClient();
        console.log(`[SyncEngine Action] Pulling all sync data since ${lastSyncTime}`);

        // 1. Pull Cards
        const { data: cards } = await supabase
            .from('cards')
            .select('*')
            .gt('updated_at', lastSyncTime);

        // 2. Pull Stories
        const [legacyStoriesRes, dailyStoriesRes] = await Promise.all([
            supabase
                .from('stories')
                .select('*')
                .gt('created_at', lastSyncTime),
            supabase
                .from('daily_stories')
                .select('*')
                .gt('created_at', lastSyncTime)
        ]);

        let progress = null;
        let squadMembers = null;

        if (userId) {
            // 3. User Progress
            const { data: prog } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', userId)
                .single();
            progress = prog;

            // 4. Squads
            const { data: members } = await supabase
                .from('squad_members')
                .select('*, squads(*)')
                .eq('user_id', userId);
            squadMembers = members;
        }

        return {
            success: true,
            cards: cards || [],
            legacyStories: legacyStoriesRes.data || [],
            dailyStories: dailyStoriesRes.data || [],
            progress,
            squadMembers: squadMembers || []
        };
    } catch (e: any) {
        console.error('[SyncEngine Action] Full sync fetch error:', e);
        return { success: false, error: e.message };
    }
}
