'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Vault Feedback System
// Instagram-style DM Server Actions
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { revalidatePath } from 'next/cache';

// ── User Actions ──

/**
 * Creates a new feedback thread and inserts the initial message.
 */
export async function createFeedbackThread(topic: string, initialMessage: string) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return { success: false, error: 'Unauthorized' };
        }

        // 1. Create the Thread
        const { data: threadData, error: threadError } = await supabase
            .from('feedback_threads')
            .insert({
                user_id: userData.user.id,
                topic: topic,
                status: 'open'
            })
            .select('*')
            .single();

        if (threadError) throw threadError;

        // 2. Insert the initial Message
        const { data: msgData, error: msgError } = await supabase
            .from('feedback_messages')
            .insert({
                thread_id: threadData.id,
                sender_type: 'user',
                content: initialMessage
            })
            .select('*')
            .single();

        if (msgError) throw msgError;

        revalidatePath('/library');
        return { success: true, thread: threadData, message: msgData };

    } catch (err: any) {
        console.error('[createFeedbackThread] Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Gets all feedback threads for the current authenticated user.
 */
export async function getUserFeedbackThreads() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return { success: false, error: 'Unauthorized', threads: [] };
        }

        const { data, error } = await supabase
            .from('feedback_threads')
            .select(`
                *,
                feedback_messages!inner(content, created_at)
            `)
            .eq('user_id', userData.user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return { success: true, threads: data };
    } catch (err: any) {
        console.error('[getUserFeedbackThreads] Error:', err);
        return { success: false, error: err.message, threads: [] };
    }
}

/**
 * Gets all messages for a specific thread, ensuring the user owns it (via RLS).
 */
export async function getFeedbackMessages(threadId: string) {
    try {
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from('feedback_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true }); // Chronological order like a chat

        if (error) throw error;

        return { success: true, messages: data };
    } catch (err: any) {
        console.error('[getFeedbackMessages] Error:', err);
        return { success: false, error: err.message, messages: [] };
    }
}

/**
 * Sends a message in an existing thread.
 */
export async function sendFeedbackMessage(threadId: string, content: string, senderType: 'user' | 'admin' = 'user') {
    try {
        const supabase = await createServerSupabaseClient();

        // Ensure user cannot spoof admin messages
        if (senderType === 'admin') {
            return { success: false, error: 'Unauthorized to send as admin via this endpoint.' };
        }

        const { data, error } = await supabase
            .from('feedback_messages')
            .insert({
                thread_id: threadId,
                sender_type: senderType,
                content: content
            })
            .select('*')
            .single();

        if (error) throw error;

        revalidatePath('/library');
        return { success: true, message: data };

    } catch (err: any) {
        console.error('[sendFeedbackMessage] Error:', err);
        return { success: false, error: err.message };
    }
}
