'use server';

import { supabase } from '@/lib/core/supabase/client';
import { CardStatus } from '@/types';

export async function globalSearchCards(query: string, subject?: string) {
    try {
        const supabaseClient = supabase; // Use the existing public client

        // 1. Search in Cards Table
        let cardQuery = supabaseClient
            .from('cards')
            .select('*')
            .eq('status', CardStatus.LIVE)
            .or(`front.ilike.%${query}%,back.ilike.%${query}%,topic.ilike.%${query}%`);

        if (subject && subject !== 'All') {
            cardQuery = cardQuery.eq('subject', subject);
        }

        // 2. Search in Intelligence Vault Table
        let vaultQuery = supabaseClient
            .from('intelligence_vault')
            .select('*')
            .or(`source_name.ilike.%${query}%,content.ilike.%${query}%`);

        if (subject && subject !== 'All') {
            vaultQuery = vaultQuery.ilike('metadata->>topic', `%${subject}%`);
        }

        const [cardsRes, vaultRes] = await Promise.all([
            cardQuery.limit(10),
            vaultQuery.limit(10)
        ]);

        if (cardsRes.error) throw cardsRes.error;
        if (vaultRes.error) throw vaultRes.error;

        // 3. Unify Results (Standardize format for Library UI)
        const unifiedResults = [
            ...(cardsRes.data || []),
            ...(vaultRes.data || []).map(node => ({
                id: node.id,
                subject: node.metadata?.topic || 'Intelligence',
                topic: node.source_name,
                front: node.content,
                isVaultNode: true
            }))
        ];

        return { success: true, cards: unifiedResults };
    } catch (error: any) {
        console.error('Unified Search failed:', error);
        return { success: false, error: error.message };
    }
}
