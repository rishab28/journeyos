'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Ingest Server Action (Auto-Chunking Engine)
// PDF text → chunk → multiple Gemini calls → Live cards
// ═══════════════════════════════════════════════════════════

import { extractCardsFromText, generateEmbedding } from '@/lib/ai/gemini';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { Domain, Subject, IngestResult } from '@/types';

interface IngestInput {
    text: string;
    domain: Domain;
    subject: Subject;
    topic: string;
    examTags: string[];
    sourcePdf?: string;
    interestProfile?: string;
    upscIQ?: number;
}

// ─── Main Ingest Function ───────────────────────────────────

export async function ingestText(input: IngestInput): Promise<IngestResult> {
    try {
        const { text, domain, subject, topic, examTags, sourcePdf, interestProfile, upscIQ } = input;

        // ── Validate text ──
        if (!text || text.trim().length < 50) {
            return { success: false, cardsCreated: 0, cards: [], errors: ['Text too short or empty (min 50 chars)'] };
        }

        if (!subject || !topic) {
            return { success: false, cardsCreated: 0, cards: [], errors: ['Subject and topic are required'] };
        }

        // Trim to ~300k chars just in case, though the client gives us chunks
        const trimmedText = text.slice(0, 300000);

        console.log(`[Ingestor] Processing chunk server-side (${trimmedText.length} chars)...`);

        let allCards: IngestResult['cards'] = [];
        const errors: string[] = [];

        try {
            const result = await extractCardsFromText(trimmedText, subject, topic, [], interestProfile, upscIQ);

            if (result.error) {
                console.warn(`[Ingestor] Chunk warning: ${result.error}`);
                errors.push(`Chunk: ${result.error}`);
            }

            if (result.cards.length > 0) {
                allCards = result.cards;
                console.log(`[Ingestor] Chunk → ${result.cards.length} cards extracted.`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error(`[Ingestor] Chunk failed: ${message}`);
            errors.push(`Chunk failed: ${message}`);
        }

        if (allCards.length === 0) {
            return {
                success: false,
                cardsCreated: 0,
                cards: [],
                errors: errors.length > 0 ? errors : ['AI found no extractable cards in any chunk'],
            };
        }

        // ── Generate Embeddings for all cards ──
        console.log(`[Ingestor] Generating embeddings for ${allCards.length} cards...`);
        const cardsWithEmbeddings = [];
        for (const card of allCards) {
            const textToEmbed = `Front: ${card.front}\nBack: ${card.back}\nExplanation: ${card.explanation || ''}\nTrick: ${card.topperTrick || card.eliminationTrick || ''}\nSubject: ${subject}\nTopic: ${topic}`;
            try {
                const embedding = await generateEmbedding(textToEmbed);
                cardsWithEmbeddings.push({ ...card, embedding });
            } catch (err) {
                console.warn(`[Ingestor] Failed to generate embedding for card: ${card.front?.substring(0, 30)}...`);
                cardsWithEmbeddings.push({ ...card, embedding: null });
            }
        }

        // ── Insert ALL cards into Supabase as LIVE ──
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        const supabase = createClient(supabaseUrl, supabaseKey);
        const cardsToInsert = cardsWithEmbeddings.map(card => ({
            type: card.type || 'FLASHCARD',
            domain: domain as string,
            subject: subject as string,
            topic,
            sub_topic: card.subTopic || null,
            difficulty: card.difficulty || 'MEDIUM',
            exam_tags: examTags,
            scaffold_level: card.scaffoldLevel || 'Intermediate',
            custom_analogy: card.customAnalogy || null,
            status: 'live',  // ← Directly live, no review needed for admin uploads
            front: card.front,
            back: card.back,
            explanation: card.explanation || null,
            topper_trick: card.topperTrick || null,
            elimination_trick: card.eliminationTrick || null,
            mains_point: card.mainsPoint || null,
            syllabus_topic: card.syllabusTopic || null,
            cross_refs: card.crossRefs || null,
            is_pyq_tagged: card.isPyqTagged || false,
            pyq_years: card.pyqYears || null,
            current_affairs: card.currentAffairs || null,
            priority_score: card.priorityScore ?? 5,
            options: card.options || null,
            source_pdf: sourcePdf || null,
            ease_factor: 2.5,
            interval: 0,
            repetitions: 0,
            embedding: card.embedding,
            next_review_date: new Date().toISOString(),
        }));

        const { error: dbError } = await supabase
            .from('cards')
            .insert(cardsToInsert);

        if (dbError) {
            return {
                success: false,
                cardsCreated: 0,
                cards: allCards,
                errors: [`DB error: ${dbError.message}. ${allCards.length} cards were extracted but not saved.`],
            };
        }

        console.log(`[Ingestor] ✅ ${allCards.length} cards saved as LIVE from chunk.`);

        return {
            success: true,
            cardsCreated: allCards.length,
            cards: allCards,
            errors: errors.length > 0 ? errors : [],
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, cardsCreated: 0, cards: [], errors: [message] };
    }
}
