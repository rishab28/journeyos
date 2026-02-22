'use server';

import { supabase } from '@/lib/supabase/client';
import { CardStatus } from '@/types';

export async function globalSearchCards(query: string, subject?: string) {
    try {
        let dbQuery = supabase
            .from('cards')
            .select('*')
            .eq('status', CardStatus.LIVE)
            .or(`front.ilike.%${query}%,back.ilike.%${query}%,topic.ilike.%${query}%`);

        if (subject && subject !== 'All') {
            dbQuery = dbQuery.eq('subject', subject);
        }

        const { data, error } = await dbQuery.limit(20);

        if (error) throw error;
        return { success: true, cards: data };
    } catch (error: any) {
        console.error('Search failed:', error);
        return { success: false, error: error.message };
    }
}
