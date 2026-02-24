'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Telemetry Writer
// Records user behaviors for the Admin Panopticon War Room
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

export type CognitiveAction = 'card_swiped' | 'ai_doubt' | 'mains_submit' | 'mains_evaluated' | 'story_viewed' | 'session_start';

interface TelemetryPayload {
    action: CognitiveAction;
    targetId?: string;
    metadata?: Record<string, any>;
}

export async function trackCognitiveAction(payload: TelemetryPayload) {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthenticated telemetry drop' };

        // 2. Handle session starts specially
        if (payload.action === 'session_start') {
            await supabase.from('user_sessions').insert({
                user_id: user.id,
                device_type: payload.metadata?.deviceType || 'unknown',
                session_start: new Date().toISOString()
            });
            // Update profile
            try {
                await supabase.rpc('increment_session_count', { uid: user.id });
            } catch (rpcError) {
                console.warn('[Telemetry] Session increment failed:', rpcError);
            }
            return { success: true };
        }

        // 3. Log cognitive action
        const { error } = await supabase.from('cognitive_telemetry').insert({
            user_id: user.id,
            action_type: payload.action,
            target_id: payload.targetId,
            metadata: payload.metadata || {}
        });

        if (error) throw error;

        return { success: true };
    } catch (e: any) {
        // Silently fail to not block the user experience
        console.warn('[Telemetry] Tracking gap:', e.message);
        return { success: false };
    }
}
