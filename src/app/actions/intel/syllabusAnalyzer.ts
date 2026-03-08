'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Syllabus Scanner & Vectorizer
// Maps official exam blueprints into a hierarchical logic tree.
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { generateEmbedding } from '@/lib/core/ai/gemini';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';

interface SyllabusNodeInput {
    examType: string;
    paperName: string;
    content: string; // The raw syllabus text for that paper
}

/**
 * 1. Deep Analyzes syllabus text.
 * 2. Extracts structured hierarchy.
 * 3. Embeds and saves to DB.
 */
export async function ingestSyllabusPaper(input: SyllabusNodeInput) {
    try {
        const prompt = `You are the JourneyOS 'Syllabus Architect'.
TASK: Convert the raw syllabus text for ${input.examType} ${input.paperName} into a hierarchical logic tree.

SYLLABUS TEXT:
${input.content}

RULES:
1. Level 1: Major Subjects (e.g., 'Polity', 'History').
2. Level 2: Core Topics (e.g., 'Federalism', 'Ancient India').
3. Level 3: Specific Subtopics (e.g., 'Governor\\'s Powers', 'Indus Valley Civilization').
4. Be comprehensive but crisp.

CRITICAL: Return a JSON object with this exact schema:
{
  "nodes": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "level": 1,
      "parentName": "Parent Subject Name (null if level 1)"
    }
  ]
}`;

        const result = await neuralGateway.generateContent({
            model: 'gemini-2.0-flash',
            userPrompt: prompt,
            responseFormat: 'json',
            maxTokens: 8192
        });

        let rawJson;
        try {
            rawJson = JSON.parse(result.text);
        } catch (e) {
            console.error('[Syllabus] JSON Parse Error:', e);
            return { success: false, error: 'AI returned invalid JSON' };
        }

        const nodes = rawJson.nodes;


        const supabase = createServerSupabaseClient();
        const nodeNameMap = new Map<string, string>(); // name -> uuid

        console.log(`[Syllabus] Processing ${nodes.length} nodes for ${input.paperName}...`);

        for (const node of nodes) {
            // Wait a bit to avoid rate limits on embeddings
            const embedding = await generateEmbedding(`${node.name}: ${node.description}`);

            // Find parent UUID if applicable
            const parentId = node.parentName ? nodeNameMap.get(node.parentName) : null;

            const { data, error } = await supabase.from('syllabus_nodes').insert({
                exam_type: input.examType,
                paper_name: input.paperName,
                node_name: node.name,
                description: node.description,
                level: node.level,
                parent_id: parentId,
                embedding: embedding
            }).select('id').single();

            if (error) {
                console.error(`[Syllabus] Node ${node.name} failed:`, error);
                continue;
            }

            if (data) {
                nodeNameMap.set(node.name, data.id);
            }
        }

        return { success: true, count: nodes.length };

    } catch (error) {
        console.error('[Syllabus Ingestor] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown failure' };
    }
}
