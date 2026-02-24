'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Intelligence Vault Browser Actions
// CRUD operations for the Global Content Repository
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { StudyCard, CardStatus, Subject, CardType } from '@/types';
import { revalidatePath } from 'next/cache';

export async function browseCards(params: {
    query?: string;
    subject?: Subject;
    status?: CardStatus;
    type?: CardType;
    page?: number;
    limit?: number;
}) {
    try {
        const { query, subject, status, type, page = 1, limit = 50 } = params;
        const supabase = createServerSupabaseClient();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let dbQuery = supabase
            .from('cards')
            .select('*', { count: 'exact' });

        if (query) {
            dbQuery = dbQuery.or(`front.ilike.%${query}%,back.ilike.%${query}%,topic.ilike.%${query}%`);
        }
        if (subject) dbQuery = dbQuery.eq('subject', subject);
        if (status) dbQuery = dbQuery.eq('status', status);
        if (type) dbQuery = dbQuery.eq('type', type);

        const { data, count, error } = await dbQuery
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            success: true,
            data: data as StudyCard[],
            total: count || 0
        };
    } catch (error) {
        console.error('[Vault Browser] Fetch Error:', error);
        return { success: false, error: 'Failed to fetch cards' };
    }
}

export async function updateVaultCard(cardId: string, updates: Partial<StudyCard>) {
    try {
        const supabase = createServerSupabaseClient();

        // Map camelCase to snake_case if necessary, but assuming types/index.ts DBCard mapping or using Json update
        // To be safe and fast, we'll update the fields explicitly needed for the admin browser
        const { error } = await supabase
            .from('cards')
            .update({
                front: updates.front,
                back: updates.back,
                topic: updates.topic,
                status: updates.status,
                subject: updates.subject,
                difficulty: updates.difficulty,
                explanation: updates.explanation,
                updated_at: new Date().toISOString()
            })
            .eq('id', cardId);

        if (error) throw error;

        revalidatePath('/admin/vault/browser');
        return { success: true };
    } catch (error) {
        console.error('[Vault Browser] Update Error:', error);
        return { success: false, error: 'Failed to update card' };
    }
}

export async function deleteVaultCard(cardId: string) {
    try {
        const supabase = createServerSupabaseClient();
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId);

        if (error) throw error;

        revalidatePath('/admin/vault/browser');
        return { success: true };
    } catch (error) {
        console.error('[Vault Browser] Delete Error:', error);
        return { success: false, error: 'Failed to delete card' };
    }
}
