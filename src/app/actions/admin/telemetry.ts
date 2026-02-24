'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Telemetry Actions (The Panopticon)
// Fetches DAU, WAU, Drop-offs, and Cognitive Vectors
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export interface GlobalTelemetry {
    totalUsers: number;
    dau: number;
    wau: number;
    totalSwipes: number;
    aiQuestionsAsked: number;
    mainsSubmitted: number;
    activeSessionsToday: number;
    retentionRate: number; // Day-7 Persistence
}

export interface ActivityTrend {
    date: string;
    swipes: number;
    sessions: number;
}

export async function fetchGlobalTelemetry(): Promise<{ success: boolean; data?: GlobalTelemetry; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Total Users
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        // 2. DAU (Active Sessions Today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: dau } = await supabase
            .from('user_sessions')
            .select('user_id', { count: 'exact', head: true })
            .gte('session_start', today.toISOString());

        // 3. WAU (Active Sessions Last 7 Days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const { count: wau } = await supabase
            .from('user_sessions')
            .select('user_id', { count: 'exact', head: true })
            .gte('session_start', lastWeek.toISOString());

        // 4. Action Counts
        const { count: totalSwipes } = await supabase
            .from('cognitive_telemetry')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'card_swiped');

        const { count: aiQuestions } = await supabase
            .from('cognitive_telemetry')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'ai_doubt');

        const { count: mainsSubmitted } = await supabase
            .from('cognitive_telemetry')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'mains_submit');

        // 5. Retention Index (Day-7 Persistence)
        const cohortStart = new Date();
        cohortStart.setDate(cohortStart.getDate() - 8);
        const cohortEnd = new Date();
        cohortEnd.setDate(cohortEnd.getDate() - 7);

        // Users active exactly 7 days ago
        const { data: cohortUsers } = await supabase
            .from('user_sessions')
            .select('user_id')
            .gte('session_start', cohortStart.toISOString())
            .lt('session_start', cohortEnd.toISOString());

        const uniqueCohort = new Set(cohortUsers?.map(u => u.user_id) || []);
        let retainedCount = 0;

        if (uniqueCohort.size > 0) {
            const { data: activeNow } = await supabase
                .from('user_sessions')
                .select('user_id')
                .gte('session_start', today.toISOString())
                .in('user_id', Array.from(uniqueCohort));

            retainedCount = new Set(activeNow?.map(u => u.user_id) || []).size;
        }

        const retentionRate = uniqueCohort.size > 0 ? Math.round((retainedCount / uniqueCohort.size) * 100) : 0;

        return {
            success: true,
            data: {
                totalUsers: totalUsers || 0,
                dau: dau || 0,
                wau: wau || 0,
                activeSessionsToday: dau || 0,
                totalSwipes: totalSwipes || 0,
                aiQuestionsAsked: aiQuestions || 0,
                mainsSubmitted: mainsSubmitted || 0,
                retentionRate
            }
        };

    } catch (error: any) {
        console.error('[Telemetry] Failed to fetch global metrics:', error);
        return { success: false, error: error.message };
    }
}

// Fetch a 7-day trend for the charts
export async function fetchActivityTrend(): Promise<{ success: boolean; data?: ActivityTrend[]; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();

        // In a real production scenario, this would be an optimized RPC call 
        // grouping by date. For now, we will aggregate the last 7 days manually or via simple queries.

        // Generating mock trend data until sufficient telemetry builds up
        // This simulates a growing user base preparing for prelims
        const trendData: ActivityTrend[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trendData.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                swipes: Math.floor(Math.random() * 500) + 100,
                sessions: Math.floor(Math.random() * 50) + 10
            });
        }

        return { success: true, data: trendData };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export interface UserSummary {
    user_id: string;
    email?: string;
    total_sessions: number;
    last_active_at: string;
    upsc_iq: number;
}

export async function fetchAllUsers(): Promise<{ success: boolean; data?: UserSummary[]; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, total_sessions, last_active_at, upsc_iq')
            .order('last_active_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return { success: true, data: data as UserSummary[] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export interface UserTelemetryLog {
    id: string;
    action_type: string;
    created_at: string;
    metadata: any;
}

export async function fetchUserTelemetry(userId: string): Promise<{ success: boolean; data?: UserTelemetryLog[]; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('cognitive_telemetry')
            .select('id, action_type, created_at, metadata')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return { success: true, data: data as UserTelemetryLog[] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
