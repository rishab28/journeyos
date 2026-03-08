'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Vault Feedback Actions
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Gets all feedback threads from all users for the Admin panel.
 * Uses the Service Role key to bypass RLS.
 */
export async function getAllFeedbackThreads() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        // Use service role client to bypass RLS
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('feedback_threads')
            .select(`
                *,
                feedback_messages(content, created_at, sender_type),
                profiles(full_name, avatar_url)
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return { success: true, threads: data };
    } catch (err: any) {
        console.error('[getAllFeedbackThreads] Error:', err);
        return { success: false, error: err.message, threads: [] };
    }
}

/**
 * Sends a reply as an admin to an existing thread.
 * Uses the Service Role key to bypass RLS logic that restricts admin spoofing.
 */
export async function sendAdminFeedbackMessage(threadId: string, content: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        // Use service role client to bypass RLS
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('feedback_messages')
            .insert({
                thread_id: threadId,
                sender_type: 'admin',
                content: content
            })
            .select('*')
            .single();

        if (error) throw error;

        // Also update the thread status to 'resolved' if desired, but for now just send message.
        revalidatePath('/admin/feedback');
        return { success: true, message: data };

    } catch (err: any) {
        console.error('[sendAdminFeedbackMessage] Error:', err);
        return { success: false, error: err.message };
    }
}
