'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Global Settings Actions
// Operational overrides for AI and SRS engines
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSystemConfigs() {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('system_configs')
            .select('*');

        // Defaults to fall back to if table missing or empty
        const defaults = {
            ai_gateway: { provider: 'gemini', model: 'gemini-1.5-pro', temperature: 0.7 },
            srs_calibration: { base_ease: 2.5, min_ease: 1.3, interval_modifier: 1.0 },
            prompt_version: { extraction_v: '2.1', analogy_v: '1.8' }
        };

        if (error) {
            console.warn('[Settings] Table missing or query error, using defaults:', error.message);
            return { success: true, data: defaults };
        }

        // Convert array to key-value object
        const configs = (data || []).reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, { ...defaults });

        return { success: true, data: configs };
    } catch (e: any) {
        console.error('[Settings] Unexpected Error:', e);
        return {
            success: false,
            error: e.message || 'Unexpected error',
            data: {
                ai_gateway: { provider: 'gemini', model: 'gemini-1.5-pro', temperature: 0.7 },
                srs_calibration: { base_ease: 2.5, min_ease: 1.3, interval_modifier: 1.0 }
            }
        };
    }
}

export async function updateSystemConfig(key: string, value: any) {
    try {
        const supabase = createServerSupabaseClient();
        const { error } = await supabase
            .from('system_configs')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error('[Settings] Update Error:', error);
        return { success: false, error: 'Failed to update configuration' };
    }
}
