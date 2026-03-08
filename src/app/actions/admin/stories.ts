'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Stories Engine V2 (Hyper-Active)
// Scrapes, filters, and summarizes news for UPSC
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { PROMPTS } from '@/lib/core/ai/prompts';
import { Subject } from '@/types';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'sync_trace.log');

function logTrace(msg: string) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, formatted);
    } catch (e) {
        // Ignore log failures
    }
}

const RSS_FEEDS = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss' },
    { name: 'Indian Express', url: 'https://indianexpress.com/feed/' },
    { name: 'PIB News', url: 'https://pib.gov.in/RssMain.aspx' },
    { name: 'PRS India', url: 'https://prsindia.org/rss/all' },
    { name: 'LiveMint Economy', url: 'https://www.livemint.com/rss/economy' },
    { name: 'Down To Earth', url: 'https://www.downtoearth.org.in/rss/all' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
];

interface RawNewsItem {
    title: string;
    link: string;
    description?: string;
    source: string;
}

/**
 * Main coordinator: Scrapes RSS → AI Batch Filter → Saves to DB
 */
export async function scrapeAndSyncStories() {
    logTrace('[StoriesEngine] Starting sync cycle...');
    try {
        if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE); // Reset log

        // 1. Fetch RSS Feeds
        const rawItems = await fetchRSSFeeds();
        logTrace(`[StoriesEngine] Fetched ${rawItems.length} raw items.`);

        if (rawItems.length === 0) {
            logTrace('[StoriesEngine] No raw items found. Exiting.');
            return { success: true, count: 0 };
        }

        // 2. Process in Batches (Surgical handling for 429 Rate Limits)
        const supabase = await createServerSupabaseClient();
        let savedCount = 0;
        const totalToProcess = Math.min(rawItems.length, 50); // Restored for full coverage
        const batchSize = 3;
        logTrace(`[StoriesEngine] Processing top ${totalToProcess} from ${rawItems.length} items.`);

        for (let i = 0; i < totalToProcess; i += batchSize) {
            const batch = rawItems.slice(i, i + batchSize);
            logTrace(`[StoriesEngine] Batch starting at index ${i} (${batch.length} items)...`);
            logTrace(`[StoriesEngine] Titles: ${batch.map(b => b.title).join(' | ')}`);

            try {
                // AI: Unified Synthesis (Story + Card in one call)
                const prompt = `
                ${PROMPTS.SurgicalNews.SYSTEM}
                
                BATCH TO PROCESS:
                ${batch.map((it, idx) => `[${idx}] ${it.source}: ${it.title}\nDescription: ${it.description || 'N/A'}`).join('\n---\n')}
                
                Return a JSON array of processed items.
                `;

                let result;
                let retryCount = 0;
                while (retryCount < 2) {
                    try {
                        result = await neuralGateway.generateContent({
                            model: 'gemini-2.0-flash',
                            userPrompt: prompt,
                            responseFormat: 'json',
                            maxTokens: 4096
                        });
                        break;
                    } catch (aiErr: any) {
                        if (aiErr.status === 429) {
                            const delay = retryCount === 0 ? 30000 : 60000;
                            logTrace(`[StoriesEngine] Rate Limit hit in batch ${i}. Sleeping for ${delay / 1000}s...`);
                            await new Promise(r => setTimeout(r, delay));
                            retryCount++;
                        } else {
                            throw aiErr;
                        }
                    }
                }

                if (!result) {
                    logTrace(`[StoriesEngine] AI returned no result for batch ${i}. Skipping.`);
                    continue;
                }

                let relevantItems: any[] = [];
                try {
                    relevantItems = JSON.parse(result.text);
                } catch (parseErr) {
                    logTrace(`[StoriesEngine] Batch ${i} JSON parse failed. Raw: ${result.text.substring(0, 100)}`);
                    relevantItems = safeParseJSON(result.text);
                }

                if (!Array.isArray(relevantItems)) {
                    logTrace(`[StoriesEngine] Batch ${i}: AI returned non-array result. Skipping.`);
                    continue;
                }

                logTrace(`[StoriesEngine] Batch ${i}: AI found ${relevantItems.filter((it: any) => it.isRelevant).length} relevant items.`);

                for (const aiItem of relevantItems) {
                    const originalIndex = aiItem.originalIndex !== undefined ? aiItem.originalIndex : 0;
                    const original = batch[originalIndex];

                    if (!aiItem.isRelevant) {
                        logTrace(`[StoriesEngine] Rejected (Irrelevant): ${aiItem.title || original?.title || 'Unknown'}`);
                        continue;
                    }

                    if (!original) {
                        logTrace(`[StoriesEngine] No original item found for index ${originalIndex}. Skipping.`);
                        continue;
                    }

                    // Deduplication (Multi-layer: URL and Title)
                    const cleanTitle = (aiItem.title || original.title).replace(/"/g, "'");
                    const { data: existing, error: dedupErr } = await supabase
                        .from('daily_stories')
                        .select('id')
                        .or(`title.eq."${cleanTitle}",source_url.eq."${original.link}"`)
                        .gt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
                        .maybeSingle();

                    if (dedupErr) {
                        logTrace(`[StoriesEngine] Dedup Err for "${cleanTitle}": ${JSON.stringify(dedupErr)}`);
                    }

                    if (existing) {
                        logTrace(`[StoriesEngine] Duplicate check: Already exists "${cleanTitle}"`);
                        continue;
                    }

                    logTrace(`[StoriesEngine] 🚀 Processing NEW Story: ${cleanTitle}`);

                    // 1. Save Card First (Permanent Asset)
                    let cardId: string | null = null;
                    if (aiItem.card) {
                        const { data: cardData, error: cardErr } = await supabase
                            .from('cards')
                            .insert({
                                front: aiItem.card.front,
                                back: aiItem.card.back,
                                options: aiItem.card.options,
                                type: aiItem.card.type || (aiItem.card.options ? 'mcq' : 'flashcard'),
                                subject: aiItem.subject,
                                topic: aiItem.topic || aiItem.syllabus_topic,
                                status: 'live',
                                ease_factor: 2.5,
                                interval: 0,
                                repetitions: 0,
                                next_review_date: new Date().toISOString(),
                                metadata: {
                                    source: original.source,
                                    source_url: original.link,
                                    auto_generated: true,
                                    generation_date: new Date().toISOString()
                                }
                            })
                            .select('id')
                            .single();

                        if (!cardErr && cardData) {
                            cardId = cardData.id;
                            logTrace(`[StoriesEngine] Card saved: ${cardId}`);
                        } else {
                            logTrace(`[StoriesEngine] Card Insert Error: ${JSON.stringify(cardErr)}`);
                        }
                    }

                    // 2. Save Story Linked to Card
                    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
                    const { error: storyErr } = await supabase
                        .from('daily_stories')
                        .insert({
                            subject: aiItem.subject,
                            title: aiItem.title || original.title,
                            summary: aiItem.story || aiItem.summary,
                            syllabus_topic: aiItem.topic || aiItem.syllabus_topic || 'General',
                            mains_fodder: aiItem.mains_fodder || aiItem.mainsFodder || '',
                            source_url: original.link,
                            card_id: cardId,
                            metadata: { source: original.source },
                            expires_at: expiresAt
                        });

                    if (!storyErr) {
                        savedCount++;
                        logTrace(`[StoriesEngine] Saved: ${original.title}`);
                    } else {
                        logTrace(`[StoriesEngine] Story Insert Error: ${JSON.stringify(storyErr)}`);
                    }
                }

                // Small delay between batches
                await new Promise(r => setTimeout(r, 2000));

            } catch (batchErr: any) {
                logTrace(`[StoriesEngine] Fatal error in batch ${i}: ${batchErr.message}`);
                continue;
            }
        }

        logTrace(`[StoriesEngine] Cycle complete. Saved ${savedCount} new stories.`);
        return { success: true, count: savedCount };
    } catch (error: any) {
        logTrace(`[StoriesEngine] Global Failure: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Capture a surgical story and convert it into a permanent Flashcard in the Vault.
 */
export async function saveStoryToVault(storyId: string) {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Fetch story details
        const { data: story, error: storyError } = await supabase
            .from('daily_stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (storyError || !story) throw new Error('Story not found');

        // 2. Optimization: If card already exists (pre-generated), just return success
        if (story.card_id) {
            console.log(`[saveStoryToVault] Story ${storyId} already has pre-generated card ${story.card_id}. Skipping AI.`);
            return { success: true, alreadyExists: true };
        }

        // 3. Fallback: Generate Flashcard Content via Neural Gateway (Legacy/Missing path)
        const prompt = `Convert this news story into a permanent high-yield UPSC Flashcard.
        STORY TITLE: ${story.title}
        SUMMARY: ${story.summary.join(' ')}
        SYLLABUS TOPIC: ${story.syllabus_topic}

        Strictly follow:
        1. TYPE: Conceptual / Analytical MCQ or Fact - based.
        2. TONE: Serious, strategic, and high - IQ.
        
        Return ONLY valid JSON with this exact schema:
        {
            "front": "Conceptual question",
                "back": "Detailed but concise answer",
                    "options": ["Op A", "Op B", "Op C", "Op D"] // Optional, only if MCQ
        } `;

        const result = await neuralGateway.generateContent({
            model: 'gemini-2.0-flash',
            userPrompt: prompt,
            responseFormat: 'json'
        });

        const cardContent = JSON.parse(result.text);

        // 3. Save to 'cards' table
        const { error: cardError } = await supabase
            .from('cards')
            .insert({
                front: cardContent.front,
                back: cardContent.back,
                options: cardContent.options,
                type: cardContent.options ? 'mcq' : 'flashcard',
                subject: story.subject,
                topic: story.syllabus_topic,
                status: 'live',
                ease_factor: 2.5,
                interval: 0,
                repetitions: 0,
                next_review_date: new Date().toISOString(),
                metadata: {
                    captured_from_story: storyId,
                    source_url: story.source_url
                }
            });

        if (cardError) throw cardError;

        return { success: true };

    } catch (err: any) {
        console.error('[saveStoryToVault] Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Fetches and parses RSS feeds (native fetch + lightweight parsing)
 */
async function fetchRSSFeeds(): Promise<RawNewsItem[]> {
    const allItems: RawNewsItem[] = [];

    for (const feed of RSS_FEEDS) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(feed.url, { next: { revalidate: 0 }, signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) {
                console.warn(`[StoriesEngine] ${feed.name} returned HTTP ${response.status} `);
                continue;
            }
            const xml = await response.text();

            // Simple XML parsing using regex (avoiding heavy dependencies)
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            let match;
            while ((match = itemRegex.exec(xml)) !== null) {
                const itemContent = match[1];
                const title = extractTag(itemContent, 'title');
                const link = extractTag(itemContent, 'link');
                const description = extractTag(itemContent, 'description');

                if (title && link) {
                    allItems.push({
                        title: title.trim(),
                        link: link.trim(),
                        description: description.trim(),
                        source: feed.name
                    });
                }
            }
        } catch (err) {
            console.error(`[StoriesEngine] Error fetching ${feed.name}: `, err);
        }
    }

    return allItems;
}

function extractTag(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = content.match(regex);
    if (!match) return '';
    // Strip CDATA and HTML tags
    return match[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]*>?/gm, '')
        .trim();
}

/**
 * Robust JSON parser that handles truncated/malformed Gemini output
 */
function safeParseJSON(text: string): any[] {
    try {
        // Try direct parse first
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        // Try to repair truncated JSON
        try {
            // Find the last complete object (ends with })
            let repaired = text.trim();

            // Remove trailing incomplete object
            const lastCompleteObj = repaired.lastIndexOf('}');
            if (lastCompleteObj > 0) {
                repaired = repaired.substring(0, lastCompleteObj + 1);
                // Close the array if needed
                if (!repaired.endsWith(']')) {
                    repaired += ']';
                }
            }

            const parsed = JSON.parse(repaired);
            console.log('[StoriesEngine] JSON repaired successfully');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            console.error('[StoriesEngine] JSON repair failed. Raw:', text.substring(0, 200));
            return [];
        }
    }
}
