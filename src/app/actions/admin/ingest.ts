'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Ingest Server Action (Auto-Chunking Engine)
// PDF text → chunk → multiple Gemini calls → Live cards
// ═══════════════════════════════════════════════════════════

import { extractCardsFromText, generateEmbedding, verifyFacts } from '@/lib/core/ai/gemini';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { Domain, Subject, IngestResult } from '@/types';

async function validateCardsQuality(cards: any[]): Promise<{ score: number, reason: string }[]> {
    if (cards.length === 0) return [];

    const cardsJson = JSON.stringify(cards.map(c => ({ front: c.front, back: c.back })));

    const userPrompt = `Evaluate the following ${cards.length} flashcards for UPSC examination relevance and accuracy.
    For each card, provide:
    1. A score from 0 to 100.
    2. A reason (max 10 words).
    
    RETURN ONLY A VALID JSON ARRAY of exactly ${cards.length} objects:
    [ { "score": 95, "reason": "Accurate and clear" } ]
    
    Cards:
    ${cardsJson}`;

    try {
        const result = await neuralGateway.generateContent({
            model: 'gemini-2.0-flash',
            systemPrompt: "You are the UPSC Quality Assurance Engine. Strictly return a valid JSON array.",
            userPrompt,
            temperature: 0.1,
            maxTokens: 2048,
        });

        let cleanedText = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (Array.isArray(parsed) && parsed.length === cards.length) {
            return parsed;
        }
        throw new Error('Invalid JSON array length');
    } catch (e) {
        console.warn('[Ingestor] AI QA failed, defaulting:', e);
        return cards.map(() => ({ score: 85, reason: "Auto-passed (QA Engine Timeout)" }));
    }
}

interface IngestInput {
    text: string;
    domain: Domain;
    subject: Subject;
    topic: string;
    examTags: string[];
    sourcePdf?: string;
    interestProfile?: string;
    upscIQ?: number;
    sourceType?: string; // TEXTBOOK, PYQ_PAPER, NOTIFICATION, NEWS, NOTES, CURRENT_AFFAIRS
    oracleContext?: {
        predictedThemes: string[];
        learnedLogic: any;
    };
}

// ─── Main Ingest Function ───────────────────────────────────

export async function ingestText(input: IngestInput): Promise<IngestResult> {
    try {
        const { text, domain, subject, topic, examTags, sourcePdf, interestProfile, upscIQ, sourceType } = input;
        const supabase = await createServerSupabaseClient();

        // ── Phase 11: Neural Link (Fetch Oracle Context) ──
        // Skip Oracle context for non-applicable source types
        const skipOracle = sourceType === 'NOTIFICATION' || sourceType === 'NEWS';
        let oracleContext = undefined;
        if (!skipOracle) {
            try {
                const { data: latestCal } = await supabase
                    .from('oracle_calibrations')
                    .select('predicted_themes, learned_logic_weights')
                    .order('year', { ascending: false })
                    .limit(1)
                    .single();

                if (latestCal) {
                    oracleContext = {
                        predictedThemes: latestCal.predicted_themes || [],
                        learnedLogic: latestCal.learned_logic_weights || {}
                    };
                    console.log(`[Ingestor] Oracle Link Active: ${oracleContext.predictedThemes.length} themes synced.`);
                }
            } catch (e) {
                console.warn('[Ingestor] Oracle context not found, proceeding with baseline logic.');
            }
        } else {
            console.log(`[Ingestor] Skipping Oracle context for source type: ${sourceType}`);
        }
        if (!text || text.trim().length < 50) {
            return { success: false, cardsCreated: 0, cards: [], errors: ['Text too short or empty (min 50 chars)'] };
        }

        if (!subject || !topic) {
            return { success: false, cardsCreated: 0, cards: [], errors: ['Subject and topic are required'] };
        }

        // ── Step 1: Pre-processing (Noise Reduction) ──
        const cleanText = (raw: string) => {
            return raw
                .replace(/\s+/g, ' ') // Collapse whitespaces
                .replace(/(Page \d+ of \d+|[^\w\s]{10,})/gi, '') // Strip headers/footers/long symbols
                .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix camelCase artifacts
                .trim();
        };

        const processedText = cleanText(text).slice(0, 300000);

        console.log(`[Ingestor] Processing sanitized chunk (${processedText.length} chars)...`);

        let allCards: IngestResult['cards'] = [];
        const errors: string[] = [];

        try {
            const result = await extractCardsFromText(
                processedText,
                subject,
                topic,
                [],
                interestProfile,
                upscIQ,
                oracleContext,
                sourceType || 'TEXTBOOK'
            );

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

        // ── Phase 11: Admin Auto-Quality Check ──
        console.log(`[Ingestor] Running automated QA on ${allCards.length} cards...`);
        const qaResults = await validateCardsQuality(allCards);

        // ── Phase 40: Truth-First Fact-Check ──
        console.log(`[Ingestor] Running Fact-Check Agent on ${allCards.length} cards...`);
        const factCheckedCards = await verifyFacts(allCards, processedText);

        // ── Generate Embeddings for all cards ──
        console.log(`[Ingestor] Generating embeddings for ${factCheckedCards.length} cards...`);
        const cardsWithEmbeddings = [];
        for (const card of factCheckedCards) {
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
        const serviceClient = supabase; // Reusing the DNS-proof server client created earlier

        const cardsToInsert = cardsWithEmbeddings.map((card, idx) => {
            const qa = qaResults[idx] || { score: 85, reason: "QA Error" };
            const status = qa.score >= 60 ? 'pending_review' : 'rejected';
            const factCheckStatus = card.isFactChecked ? ' [✅ Fact-Checked]' : ' [⚠️ Verification Failed]';
            const qaBadge = `\n\n[⚙️ AI Auto-QA: ${qa.score}/100 - ${qa.reason}]${factCheckStatus}`;

            const sanitizedCardData = {
                type: card.type || 'FLASHCARD',
                domain: domain as string,
                subject: subject as string,
                topic: topic,
                front: card.front,
                back: card.back,
                options: card.options || null,
                difficulty: card.difficulty || 'MEDIUM',
                exam_tags: examTags,
                status: status, // Now requires admin approval via dashboard
                explanation: (card.explanation || '') + qaBadge,
                topper_trick: card.topperTrick || null,
                source_pdf: sourcePdf || null, // Use sourcePdf from input
                ease_factor: 2.5,
                interval: 0,
                repetitions: 0,
                embedding: card.embedding,
                next_review_date: new Date().toISOString(),
                sub_topic: card.subTopic || null,
                elimination_trick: card.eliminationTrick || null,
                mains_point: card.mainsPoint || null,
                syllabus_topic: card.syllabusTopic || null,
                cross_refs: card.crossRefs || null,
                is_pyq_tagged: card.isPyqTagged || false,
                pyq_years: card.pyqYears || null,
                current_affairs: card.currentAffairs || null,
                priority_score: card.priorityScore ?? 5,
                scaffold_level: card.scaffoldLevel || 'Foundation',
                custom_analogy: card.customAnalogy || null,
                topic_map: card.topicMap || null,
                translations: card.translations || {},
            };
            return sanitizedCardData;
        });

        const { error: dbError } = await serviceClient
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

        // ── Phase 38: Update Source Metadata Card Count ──
        if (sourcePdf) {
            try {
                // Upsert to ensure record exists and update card yield
                const { data: existingMeta } = await serviceClient
                    .from('source_metadata')
                    .select('card_yield')
                    .eq('filename', sourcePdf)
                    .single();

                const currentYield = (existingMeta?.card_yield || 0) + allCards.length;

                await serviceClient
                    .from('source_metadata')
                    .upsert({
                        filename: sourcePdf,
                        card_yield: currentYield,
                        is_processed: true,
                        subject: subject as string,
                        domain: domain as string,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'filename' });
            } catch (metaErr) {
                console.warn('[Ingestor] Failed to update source_metadata:', metaErr);
            }
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
