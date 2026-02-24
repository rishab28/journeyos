'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Mission Brief Engine (AI Synthesis)
// High-level strategic intelligence for the CEO
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface IntelNode {
    id: string;
    source_name: string;
    content: string;
    metadata: any;
}

/**
 * generateMissionBrief
 * Synthesizes all connected intelligence into a coherent "Military-Grade" briefing.
 */
export async function generateMissionBrief(nodeId: string) {
    try {
        const supabase = createServerSupabaseClient();

        // 1. Get the primary node and its connections
        const { data: mainNode } = await supabase.from('intelligence_vault').select('*').eq('id', nodeId).single();
        const { data: connections } = await supabase.rpc('get_intel_connections', { start_id: nodeId });

        if (!mainNode) throw new Error('Primary Intelligence Node not found');

        // 2. Fetch all linked content
        const linkedIds = (connections || []).map((c: any) => c.linked_id);
        const { data: linkedNodes } = await supabase
            .from('intelligence_vault')
            .select('source_name, content, metadata')
            .in('id', linkedIds);

        // 3. Prepare AI Prompt for "Product of the Century" Synthesis
        const context = `
PRIMARY INTEL: [${mainNode.source_name}]
${mainNode.content}

CONNECTED DEPLOYMENTS:
${(linkedNodes || []).map(n => `--- [${n.source_name}] ---\n${n.content}`).join('\n\n')}
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `
You are the CTO of JourneyOS, a high-complexity UPSC Intelligence System.
Synthesize the following disconnected intelligence nodes into a "Military-Grade Strategic Briefing".

Format the response with these sections:
1. 🎯 CORE OBJECTIVE: What is the central theme?
2. 🔄 CAUSAL ANCHORS: How does today's data (CA) link to history/polity foundations (Syllabus)?
3. ⚠️ LETHALITY ZONES: What are the high-yield areas for an aspirant to master here?
4. 🚀 ACTIONABLE INTEL: One precise task for the candidate.

Use professional, intense, and encouraging tone.
Keep it concise and high-impact.

INTEL CONTEXT:
${context}
`;

        const result = await model.generateContent(prompt);
        const briefing = result.response.text();

        return {
            success: true,
            briefing,
            nodeName: mainNode.source_name
        };

    } catch (error) {
        console.error('[MissionBrief] Generation failed:', error);
        return { success: false, error: 'Failed to synthesize mission briefing' };
    }
}
