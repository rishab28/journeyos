'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Stories Engine V2 (Hyper-Active)
// Scrapes, filters, and summarizes news for UPSC
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { PROMPTS } from '@/lib/core/ai/prompts';
import { Subject } from '@/types';

const RSS_FEEDS = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss' },
    { name: 'Indian Express', url: 'https://indianexpress.com/feed/' },
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'BBC News South Asia', url: 'http://feeds.bbci.co.uk/news/world/asia/rss.xml' }
];

interface RawNewsItem {
    title: string;
    link: string;
    description?: string;
    source: string;
}

/**
 * Main coordinator: Scrapes RSS → AI filters one-by-one → Saves to DB
 */
export async function scrapeAndSyncStories() {
    console.log('[StoriesEngine] Starting sync cycle...');
    try {
        // 1. Fetch RSS Feeds
        const rawItems = await fetchRSSFeeds();
        console.log(`[StoriesEngine] Fetched ${rawItems.length} raw items.`);

        // 2. Process each item one-by-one (prevents JSON truncation)
        const supabase = await createServerSupabaseClient();
        let savedCount = 0;
        const maxItems = Math.min(rawItems.length, 15); // Cap at 15 per cycle

        for (let i = 0; i < maxItems; i++) {
            const item = rawItems[i];
            try {
                // AI: Is this UPSC relevant?
                const prompt = `Is this news relevant for UPSC civil services exam? Title: "${item.title}"
If YES, return JSON: {"relevant":true,"subject":"Polity|Economy|Science|Environment|Current Affairs|History|Geography","topic":"syllabus keyword","summary":["What happened (1 line)","Why UPSC important (1 line)"],"mainsFodder":"one key data point for mains"}
If NO, return: {"relevant":false}`;

                const result = await neuralGateway.generateContent({
                    model: 'gemini-2.5-flash',
                    userPrompt: prompt,
                    responseFormat: 'json',
                    maxTokens: 1024
                });

                let parsed;
                try { parsed = JSON.parse(result.text); } catch { continue; }
                if (!parsed.relevant) continue;

                // Deduplicate
                const { data: existing } = await supabase
                    .from('daily_stories')
                    .select('id')
                    .eq('title', item.title)
                    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .maybeSingle();
                if (existing) continue;

                // Save
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                // Normalize subject to a clean single value
                const subject = (parsed.subject || 'Current Affairs').split('|')[0].trim();
                const { error } = await supabase
                    .from('daily_stories')
                    .insert({
                        subject,
                        title: item.title,
                        summary: parsed.summary || [item.title, 'Relevant for UPSC preparation.'],
                        syllabus_topic: parsed.topic || 'General',
                        mains_fodder: parsed.mainsFodder || '',
                        source_url: item.link,
                        metadata: { source: item.source },
                        expires_at: expiresAt
                    });

                if (!error) savedCount++;
                else console.error('[StoriesEngine] DB Insert Error:', error);
            } catch (err) {
                // Skip this item silently and continue
                continue;
            }
        }

        console.log(`[StoriesEngine] Cycle complete. Saved ${savedCount} new stories.`);
        return { success: true, count: savedCount };
    } catch (error: any) {
        console.error('[StoriesEngine] Sync Failed:', error);
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

        // 2. Generate Flashcard Content via Neural Gateway
        const prompt = `Convert this news story into a permanent high-yield UPSC Flashcard.
        STORY TITLE: ${story.title}
        SUMMARY: ${story.summary.join(' ')}
        SYLLABUS TOPIC: ${story.syllabus_topic}

        Strictly follow:
        1. TYPE: Conceptual/Analytical MCQ or Fact-based.
        2. TONE: Serious, strategic, and high-IQ.
        
        Return ONLY valid JSON with this exact schema:
        {
            "front": "Conceptual question",
            "back": "Detailed but concise answer",
            "options": ["Op A", "Op B", "Op C", "Op D"] // Optional, only if MCQ
        }`;

        const result = await neuralGateway.generateContent({
            model: 'gemini-2.5-flash',
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
            const response = await fetch(feed.url, { next: { revalidate: 0 } });
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
            console.error(`[StoriesEngine] Error fetching ${feed.name}:`, err);
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
 * Uses Gemini to filter for UPSC relevance and summarize into 2 bullets
 */
async function filterAndSummarizeWithAI(items: RawNewsItem[]) {
    if (items.length === 0) return [];

    // Limit to 15 items to keep the prompt within token budget
    const selectedItems = items.slice(0, 15);

    const prompt = `You are the JourneyOS News Editor. Filter these news items for UPSC/HAS exam relevance.

RULES:
1. RELEVANCE: Only pick news for: Polity, Economy, IR, Environment, Sci-Tech, History/Culture.
2. DISCARD: Political drama, local crime, sports, celebrity, generic updates.
3. SUMMARY: Exactly 2 short points. Point 1: What happened? Point 2: UPSC importance.
4. SUBJECT: One of: Polity, History, Geography, Economy, Science, Environment, Current Affairs.
5. Keep summaries concise (under 30 words each).

NEWS:
${selectedItems.map((it: RawNewsItem, i: number) => `[${i}] ${it.source}: ${it.title}`).join('\n')}

Return JSON array (only items with relevanceScore > 7):
[{"relevanceScore":number,"subject":"string","topic":"string","title":"string","summary":["string","string"],"mainsFodder":"string","originalIndex":number}]`;

    try {
        const result = await neuralGateway.generateContent({
            model: 'gemini-2.5-flash',
            userPrompt: prompt,
            responseFormat: 'json',
            maxTokens: 8192
        });
        return safeParseJSON(result.text);
    } catch (error) {
        console.error('[StoriesEngine] AI Filtering Failed:', error);
        return [];
    }
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

/**
 * Deduplicates and saves to DB
 */
async function saveStories(stories: any[], rawItems: RawNewsItem[]) {
    const supabase = await createServerSupabaseClient();
    let savedCount = 0;

    for (const story of stories) {
        const original = rawItems[story.originalIndex];
        if (!original) {
            console.error(`[StoriesEngine] Original item not found for index: ${story.originalIndex}`);
            continue;
        }

        // Simple title-based deduplication against last 24h
        const { data: existing } = await supabase
            .from('daily_stories')
            .select('id')
            .eq('title', story.title)
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

        if (existing) {
            console.log(`[StoriesEngine] Skipping duplicate: ${story.title}`);
            continue;
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { error: insertError } = await supabase
            .from('daily_stories')
            .insert({
                subject: story.subject,
                title: story.title,
                summary: story.summary,
                syllabus_topic: story.topic,
                mains_fodder: story.mainsFodder,
                source_url: original.link,
                metadata: {
                    source: original.source,
                    relevanceScore: story.relevanceScore,
                },
                expires_at: expiresAt
            });

        if (!insertError) savedCount++;
        else console.error('[StoriesEngine] DB Insert Error:', insertError);
    }

    return savedCount;
}
