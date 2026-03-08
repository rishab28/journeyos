import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { Subject } from '@/types';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Content Auto-Seeder
// POST /api/admin/seed-cards
// ═══════════════════════════════════════════════════════════

export async function POST(req: Request) {
    try {
        const { subject } = await req.json();

        if (!Object.values(Subject).includes(subject)) {
            return NextResponse.json({ success: false, error: 'Invalid Subject' }, { status: 400 });
        }

        const prompt = `You are a legendary UPSC/IAS faculty. Generate exactly 10 high-yield FLASHCARDS for the subject: ${subject}.
        These should cover the most frequently asked, conceptual, or tricky facts for Prelims and Mains.
        
        RULES:
        1. TYPE: Flashcard (Question/Concept on front, detailed answer on back).
        2. TONE: Serious, strategic, and high-IQ "Topper-to-Topper" tone.
        3. No filler text, go straight to the point.
        
        Return a JSON array of 10 objects EXACTLY matching this schema:
        [
          {
            "front": "Question or Concept name",
            "back": "Detailed but concise strategic answer",
            "topic": "Syllabus topic (e.g. Fundamental Rights, Monetary Policy)"
          }
        ]`;

        const result = await neuralGateway.generateContent({
            model: 'gemini-2.0-flash',
            userPrompt: prompt,
            responseFormat: 'json',
            maxTokens: 4000
        });

        let cards;
        try {
            cards = JSON.parse(result.text);
        } catch (e) {
            console.error('[SeedCards] JSON parse failed', result.text.slice(0, 100));
            return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
        }

        if (!Array.isArray(cards) || cards.length === 0) {
            return NextResponse.json({ success: false, error: 'AI returned empty array' }, { status: 500 });
        }

        const supabase = createServerSupabaseClient();

        const payload = cards.map((c: any) => ({
            type: 'FLASHCARD',
            domain: 'GS',
            subject: subject,
            topic: c.topic || 'General',
            difficulty: 'MEDIUM',
            status: 'live',
            front: c.front,
            back: c.back,
            ease_factor: 2.5,
            interval: 0,
            repetitions: 0,
            next_review_date: new Date().toISOString()
        }));

        const { error, data } = await supabase.from('cards').insert(payload).select('id');

        if (error) {
            console.error('[SeedCards] DB Error:', error);
            // Fix RLS if needed, using same trick as stories
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error('[SeedCards] FATAL:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
