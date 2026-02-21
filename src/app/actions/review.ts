'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Review Server Actions
// Batch approve/reject cards for admin dashboard
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CardStatus } from '@/types';

export interface ReviewQueryParams {
    status?: CardStatus;
    domain?: string;
    subject?: string;
    page?: number;
    limit?: number;
}

export interface ReviewQueryResult {
    cards: Record<string, unknown>[];
    total: number;
    page: number;
    totalPages: number;
    error?: string;
}

export async function fetchReviewCards(params: ReviewQueryParams): Promise<ReviewQueryResult> {
    try {
        const supabase = createServerSupabaseClient();
        const page = params.page || 1;
        const limit = params.limit || 50;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('cards')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (params.status) {
            query = query.eq('status', params.status);
        }
        if (params.domain) {
            query = query.eq('domain', params.domain);
        }
        if (params.subject) {
            query = query.eq('subject', params.subject);
        }

        const { data, count, error } = await query;

        if (error) {
            return { cards: [], total: 0, page, totalPages: 0, error: error.message };
        }

        return {
            cards: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit),
        };
    } catch (error) {
        return {
            cards: [],
            total: 0,
            page: 1,
            totalPages: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function batchApproveCards(cardIds: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        if (cardIds.length === 0) {
            return { success: false, count: 0, error: 'No cards selected' };
        }

        if (cardIds.length > 100) {
            return { success: false, count: 0, error: 'Maximum 100 cards per batch' };
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from('cards')
            .update({ status: 'live', is_verified: true, updated_at: new Date().toISOString() })
            .in('id', cardIds)
            .select('id');

        if (error) {
            return { success: false, count: 0, error: error.message };
        }

        return { success: true, count: data?.length || 0 };
    } catch (error) {
        return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function rejectCards(cardIds: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        if (cardIds.length === 0) {
            return { success: false, count: 0, error: 'No cards selected' };
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from('cards')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .in('id', cardIds)
            .select('id');

        if (error) {
            return { success: false, count: 0, error: error.message };
        }

        return { success: true, count: data?.length || 0 };
    } catch (error) {
        return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
